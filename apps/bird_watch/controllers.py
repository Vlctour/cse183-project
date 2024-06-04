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
from .models import get_user_email

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
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
    )