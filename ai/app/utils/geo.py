import numpy as np

R_EARTH = 6371000.0

def latlon_to_xy(lat: float, lon: float):
    lat_r = np.radians(lat)
    lon_r = np.radians(lon)
    x = R_EARTH * lon_r * np.cos(lat_r)
    y = R_EARTH * lat_r
    return x, y
