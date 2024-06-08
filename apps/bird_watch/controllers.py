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
        get_species_url = URL('get_species', signer=url_signer),
    )

@action('get_species', method="GET")
@action.uses(db, auth, url_signer)
def get_species():
    top = request.params.get('top')
    bottom = request.params.get('bottom')
    left = request.params.get('left')
    right = request.params.get('right')
    bounds_query = ((db.checklists.latitude >= bottom) &
        (db.checklists.latitude <= top) &
        (db.checklists.longitude <= right) &
        (db.checklists.longitude >= left))
    
    # query 1
    checklist_num = db(bounds_query).count()

    # query 2
    species = db(bounds_query & 
        (db.sightings.event_id == db.checklists.event_id)
    ).select(
        db.sightings.name, 
        db.sightings.count.sum().with_alias("count"), 
        groupby=db.sightings.name
    ).as_list()

    # Handle rows where count is "X"
    x_species = db(bounds_query & 
        (db.sightings.event_id == db.checklists.event_id) &
        (db.sightings.count == "X")
    ).select(
        db.sightings.name, 
        db.sightings.count.count().with_alias("count"),
        groupby=db.sightings.name
    ).as_list()

    for i in x_species:
        i['count'] = "X"
        species.append(i)
    
    # query 3
    sum = db.sightings.count.sum()
    num_sightings = db(
        bounds_query &
        (db.sightings.event_id == db.checklists.event_id)
    ).select(sum).first()[sum]

    # query 4
    number_of_contributors = 5
    top_contributors = db(bounds_query &
        (db.sightings.event_id == db.checklists.event_id)
    ).select(
        db.checklists.observer_id.with_alias("observer_id"),
        db.checklists.duration.sum().with_alias("duration"),
        db.sightings.count.count().with_alias("count"),
        groupby=db.checklists.observer_id,
        orderby=~db.sightings.count.count(),
        limitby=(0, number_of_contributors),
    )

    top_contributor_ids = [(o.observer_id, o.count) for o in top_contributors]
    best_contributors = {}
    index = 0
    for contributor, count in top_contributor_ids:
        row = db(db.checklists.observer_id == contributor
        ).select(
            db.checklists.duration.sum().with_alias("duration")
        )
        best_contributors[index] = dict(
            observer_id=contributor, 
            count=count, 
            duration=row[0].duration
        )
        index += 1
    
    # ------------------------------

    # select observer_id, sum(duration) from checklists group by observer_id;
    # select c.observer_id, count(s.count) from checklists c, sightings s where s.event_id = c.event_id group by c.observer_id order by count(s.count) asc;
    # ---------------------------------------------------
    return dict(species=species,
                checklist_num=checklist_num,
                num_sightings=num_sightings,
                top_contributors=best_contributors)


@action('stats')
@action.uses('stats.html', db, auth, url_signer)
def stats():
    return dict(
        my_callback_url = URL('my_callback', signer=url_signer),
        get_stats_url = URL('get_stats', signer=url_signer),
        get_card_data_url = URL('get_card_data', signer=url_signer),
        display_data_url = URL('display_data', signer=url_signer)
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

    # Fetch the rows from the database
    rows = db(query).select(
        db.sightings.id, # needs aggregate
        db.checklists.event_id, # needs aggregate
        db.sightings.name,
        db.sightings.count.sum().with_alias("count"),
        show,
        groupby=db.sightings.name,
        orderby=orderby
    ).as_list()

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

@action('display_data', method="GET")
@action.uses(db, auth, url_signer)
def display_data():
    observer_id = request.params.get('observer_id')
    bird_name = request.params.get("bird_name")

    query = (
        (db.sightings.event_id == db.checklists.event_id) &
        (db.checklists.observer_id == observer_id) &
        (db.sightings.name == bird_name)
    )

    bird_data = db(query).select(
        db.checklists.date,
        db.sightings.count,
        orderby=db.checklists.date
    ).as_list()
    return dict(
        bird_name=bird_name,
        bird_data=bird_data
    )