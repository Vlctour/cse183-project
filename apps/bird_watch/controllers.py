"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email, convert_time

url_signer = URLSigner(session)

@action('index')
@action.uses('index.html', db, auth, url_signer)
def index():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
    )

@action('my_callback')
@action.uses() # Add here things like db, auth, etc.
def my_callback():
    # The return value should be a dictionary that will be sent as JSON.
    return dict(my_value=3)

@action('checklist')
@action.uses('checklist.html', db, auth, url_signer)
def checklist():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
    )

@action('location')
@action.uses('location.html', db, auth, url_signer)
def location():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
    )

@action('stats')
@action.uses('stats.html', db, auth, url_signer)
def stats():
    return dict(
        my_callback_url = URL('my_callback', signer=url_signer),
        get_stats_url = URL('get_stats', signer=url_signer),
        get_card_data_url = URL('get_card_data', signer=url_signer)
    )


@action('get_stats', method="GET")
@action.uses(db, auth, url_signer)
def get_stats():

    observer_id = request.params.get('observer_id')
    sort_most_recent = request.params.get('sort_most_recent')
    search_query = request.params.get('search_query')

    print(observer_id,sort_most_recent)
        
    query = (db.sightings.event_id == db.checklists.event_id) & (db.checklists.observer_id == observer_id)

    if search_query:
        query &= (db.sightings.name.contains(search_query))
   
    if sort_most_recent == 'true':
        orderby = ~db.checklists.date.max()
        show = db.checklists.date.max().with_alias("date")
    else:
        orderby = db.checklists.date.min()
        show = db.checklists.date.min().with_alias("date")


    # print("sorted state", sort_most_recent)
    # Fetch the rows from the database
    rows = db(query).select(
        db.sightings.id, # needs aggregate
        db.checklists.event_id, # needs aggregate
        db.sightings.name,
        db.sightings.count.count().with_alias("count"),
        show,
        groupby=db.sightings.name,
        orderby=orderby
    ).as_list()
    # rows = db(query).select(
    #     db.sightings.id,
    #     db.checklists.event_id,
    #     db.sightings.name,
    #     db.sightings.count,
    #     db.checklists.date,
    #     db.checklists.time,
    #     orderby=orderby
    # ).as_list()
    # print("data: ",rows)
    size = len(rows)
    return dict(birds_seen=rows, size=size)

@action('get_card_data', method="GET")
@action.uses(db, auth, url_signer)
def get_card_data():
    observer_id = request.params.get('observer_id')

    # Fetch unique bird species
    query = (db.sightings.event_id == db.checklists.event_id) & (db.checklists.observer_id == observer_id)
    unique_birds = db(query).select(
        db.sightings.name,
        distinct=True,
    ).as_list()

    # Fetch total number of birds seen
    sum = db.sightings.count.sum()
    total_bird_count = db(query).select(sum).first()[sum]

    # Total amount of time user spent observing
    sum2 = db.checklists.duration.sum()
    total_time = db(db.checklists.observer_id == observer_id).select(sum2).first()[sum2]
    hour, minutes = convert_time(total_time)

    unique_bird_count = len(unique_birds)
    return dict(
        unique_bird_count=unique_bird_count,
        total_bird_count=total_bird_count,
        hour=hour,
        minutes=minutes
    )