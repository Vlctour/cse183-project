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
from py4web.utils.form import Form
from py4web.utils.form import FormStyleBulma, FormStyleDefault
from py4web.utils.grid import Grid, GridClassStyleBulma, GridClassStyle

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
        get_checklist_url = URL('get_checklist', signer=url_signer),
        delete_checklist_url = URL('delete_checklist', signer=url_signer),
        handle_redirect_url = URL('handle_redirect', signer=url_signer),
    )
    
# @action('checklist/sightings', method=['GET'])
@action('checklist/sightings/<event_id>', method=['GET', 'POST'])
@action('checklist/sightings/<event_id>/<path:path>', method=['GET', 'POST'])
@action.uses('checklist_sightings.html', db, auth)
def checklist_sightings(event_id=None, path=None):
    query = (db.sightings.event_id > 0)
    showModal = 'false'
    if event_id is not None:
        query &= (db.sightings.event_id == event_id)

    # Create a form for adding a new sighting
    form = Form(db.sightings, 
                formstyle=FormStyleBulma, 
                keep_values=True,
                fields=[db.sightings.name, db.sightings.count],
                hidden=dict(event_id=event_id))

    if form.accepted:
        # This block will be executed when the form is successfully submitted
        db.sightings.insert(event_id=event_id, 
                            name=form.vars['name'], 
                            count=form.vars['count'])
        redirect(URL('checklist/sightings', event_id))

    if request.method == 'POST':
        showModal = 'true'

    grid = Grid(path,
                formstyle=FormStyleBulma,
                columns=[db.sightings.event_id, db.sightings.name, db.sightings.count],
                grid_class_style=GridClassStyleBulma,
                query=query,
                orderby=[db.sightings.id],
                create=False,
                details=False,
                search_queries=[['Search by Species', lambda val: db.sightings.name.contains(val)]],
    )
    return dict(
        grid=grid,
        form=form,
        showModal=showModal
    )

@action('get_checklist', method="GET")
@action.uses(db, auth, url_signer)
def get_checklist():
    observer_id = request.params.get('observer_id')

    query = (db.checklists.observer_id == observer_id)
    row = db(query).select().as_list()

    row2 = db(
        query & (db.checklists.event_id == db.sightings.event_id)
    ).select(
        db.sightings.event_id,
        db.sightings.count.count().with_alias("count"),
        groupby=db.sightings.event_id
    ).as_list()
    bird_count_dict = {item['sightings']['event_id']: item['count'] for item in row2}

    return dict(checklist=row, bird_count=bird_count_dict)


@action('handle_redirect', method="GET")
@action.uses(db, auth, url_signer)
def handle_redirect():
    event_id = request.params.get('event_id')
    # url = URL("checklist/sightings/", vars=dict(event_id=event_id))
    url = URL("checklist/sightings/" + event_id)
    return dict(url=url)

@action('delete_checklist', method="POST")
@action.uses(db, auth, url_signer)
def delete_checklist():
    event_id = request.json.get('event_id')
    item = db(db.checklists.event_id == event_id).select().first()
    item.delete_record()
    return dict(success=True)

@action('location')
@action.uses('location.html', db, auth, url_signer)
def location():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
        get_species_url = URL('get_species', signer=url_signer),
        get_radar_data_url = URL('get_radar_data', signer=url_signer),
        display_location_data_url = URL('display_location_data', signer=url_signer)
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
        db.sightings.id,
        db.sightings.name, 
        db.sightings.count.sum().with_alias("count"), 
        groupby=db.sightings.name,
        orderby=~db.sightings.count.sum(),
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
    number_of_contributors = 7
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

@action('get_radar_data', method="GET")
@action.uses(db, auth, url_signer)
def get_radar_data():
    top = request.params.get('top')
    bottom = request.params.get('bottom')
    left = request.params.get('left')
    right = request.params.get('right')
    bird_name = request.params.get('name')
    bounds_query = ((db.checklists.latitude >= bottom) &
        (db.checklists.latitude <= top) &
        (db.checklists.longitude <= right) &
        (db.checklists.longitude >= left))

    query = (
        (db.checklists.event_id == db.sightings.event_id) #&
        # (db.sightings.name == bird_name)
    )

    rows = db(bounds_query & query).select(
        db.checklists.date,
        db.sightings.count.sum().with_alias("count"),
        orderby=db.checklists.date,
        groupby=db.checklists.date,
    )

    radar_data = [{'date': row.checklists.date, 'count': row.count} for row in rows]
    return dict(radar_data=radar_data)

@action('display_location_data', method="GET")
@action.uses(db, auth, url_signer)
def display_location_data():
    bird_name = request.params.get("bird_name")
    top = request.params.get('top')
    bottom = request.params.get('bottom')
    left = request.params.get('left')
    right = request.params.get('right')
    bounds_query = ((db.checklists.latitude >= bottom) &
        (db.checklists.latitude <= top) &
        (db.checklists.longitude <= right) &
        (db.checklists.longitude >= left))

    query = (
        (db.sightings.event_id == db.checklists.event_id) &
        (db.sightings.name == bird_name)
    )

    bird_data = db(query).select(
        db.checklists.date,
        db.sightings.count.sum().with_alias("count"),
        orderby=db.checklists.date,
        groupby=db.checklists.date,
    ).as_list()
    return dict(
        bird_name=bird_name,
        bird_data=bird_data
    )

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