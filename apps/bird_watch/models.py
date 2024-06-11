"""
This file defines the database models
"""

import datetime
import csv
from .common import db, Field, auth
from pydal.validators import *
import random
import os



path = "apps/bird_watch/sample_data/"


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()

def get_observer_id():
    user_email = auth.current_user.get('email') if auth.current_user else None
    if user_email:
        username = user_email.split('@')[0]
        return username
    return None 

# Generates new event id that isnt already in the db
def generate_event_id():
    validator = IS_NOT_IN_DB(db, 'checklists.event_id')

    while True:
        new_event_id = f'S{random.randint(80000000, 89999999)}'
        if validator(new_event_id)[1] is None:
            return new_event_id

# given time in minutes, converts it
def convert_time(time):
    hours = time//60
    minutes = time % 60
    return hours, minutes


db.define_table(
    'species',
    Field('name'),
)

db.define_table(
    'sightings',
    Field('event_id', writable=False),
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
    Field('duration', default=0.0),
)

# populate tables with given data
# make sure to skip header using next()
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

# add pre-existing users to auth_users while populating checklists
if db(db.checklists).isempty():
    filepath=f"{path}checklists.csv"    
    with open(filepath, 'r') as f:
        reader = csv.reader(f)
        next(reader)
        unique_observers = set()
        for row in reader:
            email = f"{row[5]}@mail.com"
            observer_id = row[5]
            # Check if the observer_id is unique and not already inserted
            if observer_id not in unique_observers:
                db.auth_user.insert(
                email=email,
                first_name=row[5],
                password='')
                unique_observers.add(observer_id)

    with open(filepath, 'r') as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            duration=row[6]
            if not duration:
                duration = 0.0
            db.checklists.insert(
                event_id=row[0],
                latitude=row[1],
                longitude=row[2],
                date=row[3],
                time=row[4],
                observer_id = row[5],
                duration=duration
            )

db.commit()
