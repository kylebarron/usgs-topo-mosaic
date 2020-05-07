FROM lambgeo/lambda:gdal2.4-py3.7-geolayer

WORKDIR /tmp

ENV PYTHONUSERBASE=/var/task

COPY usgs_topo_mosaic/ usgs_topo_mosaic/
COPY setup.py setup.py

# Install dependencies
RUN pip install . --user
RUN rm -rf usgs_topo_mosaic setup.py
