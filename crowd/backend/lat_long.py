# lat_long.py
import geocoder

def get_location():
    g = geocoder.ip('me')
    if g.ok:
        return g.latlng  # returns [latitude, longitude]
    else:
        return None, None
