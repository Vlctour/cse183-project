"""
This file defines the database models
"""

import datetime
import csv
from .common import db, Field, auth
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


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
    Field('event_id'),
    Field('name'),
    Field('count'),
)

db.define_table(
    'checklists',
    Field('event_id', 'string'),
    Field('latitude', 'float'),
    Field('longitude', 'float'),
    Field('date', 'date'),
    Field('time', 'time'),
    Field('observer_id', 'string'), # maybe reference from another table
    Field('duration', 'float'),
)

if db(db.species).isempty():
    filepath='/home/vlctor/cse183_project/apps/bird_watch/sample_data/species.csv'
    with open(filepath, 'r') as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            db.species.insert(name=row[0])

if db(db.sightings).isempty():
    filepath='/home/vlctor/cse183_project/apps/bird_watch/sample_data/sightings.csv'
    with open(filepath, 'r') as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            db.sightings.insert(event_id=row[0],
                                name=row[1],
                                count=row[2])

if db(db.checklists).isempty():
    filepath='/home/vlctor/cse183_project/apps/bird_watch/sample_data/checklists.csv'
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
