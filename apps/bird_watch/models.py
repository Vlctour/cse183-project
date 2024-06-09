"""
This file defines the database models
"""

import datetime
import csv
from .common import db, Field, auth
from pydal.validators import *

path="/home/vlctor/cse183_project/apps/bird_watch/sample_data/"

def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()

def convert_time(time):
    hours = time//60
    minutes = time % 60
    return hours, minutes
### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later

db.define_table(
    'species',
    Field('name'),
)

db.define_table(
    'sightings',
    Field('event_id', writable=False), # figure out
    Field('name', requires=IS_NOT_EMPTY()),
    Field('count', default="X"),
)

db.define_table(
    'checklists',
    Field('event_id', 'string'),
    Field('latitude', 'float'),
    Field('longitude', 'float'),
    Field('date', 'date'),
    Field('time', 'time'),
    Field('observer_id', 'string'), 
    Field('duration', 'float'),
)

if db(db.species).isempty():
    filepath=f"{path}species.csv"
    with open(filepath, 'r') as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            db.species.insert(name=row[0])

if db(db.sightings).isempty():
    filepath=f"{path}sightings.csv"    
    with open(filepath, 'r') as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            db.sightings.insert(event_id=row[0],
                                name=row[1],
                                count=row[2])

if db(db.checklists).isempty():
    filepath=f"{path}checklists.csv"    
    with open(filepath, 'r') as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            db.checklists.insert(event_id=row[0],
                                latitude=row[1],
                                longitude=row[2],
                                date=row[3],
                                time=row[4],
                                observer_id=row[5],
                                duration=row[6]
                                )

db.commit()
