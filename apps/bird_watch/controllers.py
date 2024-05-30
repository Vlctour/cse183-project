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
    species = db(
        (db.checklists.latitude >= bottom) &
        (db.checklists.latitude <= top) &
        (db.checklists.longitude <= right) &
        (db.checklists.longitude >= left)
    ).select().as_list()
    sum = db.sightings.count.sum()
    num_sightings = db(
        (db.checklists.latitude >= bottom) &
        (db.checklists.latitude <= top) &
        (db.checklists.longitude <= right) &
        (db.checklists.longitude >= left) &
        (db.sightings.event_id == db.checklists.event_id)
    ).select(sum).first()[sum]
    checklist_num = len(species)
    return dict(species=species,
                checklist_num=checklist_num,
                num_sightings=num_sightings)


@action('stats')
@action.uses('stats.html', db, auth, url_signer)
def stats():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
    )