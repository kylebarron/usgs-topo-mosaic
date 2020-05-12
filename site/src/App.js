import React from "react";
import "./App.css";
import ReactMapGL, {
  Source,
  Layer,
  NavigationControl,
  ScaleControl,
} from "react-map-gl";
import { getViewStateFromHash } from "./util";
import {
  Accordion,
  Checkbox,
  Card,
  Select,
  Icon,
  Container,
} from "semantic-ui-react";
import { Map } from "immutable";

const defaultMapStyle = require("./style.json");

const defaultViewport = {
  latitude: 37.73817,
  longitude: -119.59118,
  zoom: 11,
  bearing: 0,
  pitch: 0,
};

const urls = {
  high: {
    newest: "dynamodb://us-west-2/usgs-topo_high_newest.v2",
    oldest: "dynamodb://us-west-2/usgs-topo_high_oldest.v2",
  },
  medium: {
    newest: "dynamodb://us-west-2/usgs-topo_medium_newest.v2",
    oldest: "dynamodb://us-west-2/usgs-topo_medium_oldest.v2",
  },
  low: {
    newest: "dynamodb://us-west-2/usgs-topo_low_newest.v2",
    oldest: "dynamodb://us-west-2/usgs-topo_low_oldest.v2",
  },
};

const mosaicChoiceOptions = [
  { key: "oldest", value: "oldest", text: "Oldest Available" },
  { key: "newest", value: "newest", text: "Newest Available" },
];

const scaleChoiceOptions = [
  { key: "auto", value: "auto", text: "Auto-adjust map scale used" },
  { key: "low", value: "low", text: "Low-scale map" },
  { key: "medium", value: "medium", text: "Medium-scale map" },
  { key: "high", value: "high", text: "High-scale map" },
];

// Construct tilejson url for mosaic url
function usgsTopoUrl(url) {
  const params = {
    url,
    tile_scale: 2,
    tile_format: "jpg",
  };
  const searchParams = new URLSearchParams(params);
  const baseUrl =
    "https://us-west-2-lambda.kylebarron.dev/usgs-topo/tilejson.json?";
  return baseUrl + searchParams.toString();
}

function constructMapStyle(mosaic_choice) {
  defaultMapStyle.sources["usgs-topo-low-zoom"] = {
    type: "raster",
    url: usgsTopoUrl(urls.low[mosaic_choice]),
    attribution: '<a href="https://www.usgs.gov/" target="_blank">© USGS</a>',
  };
  defaultMapStyle.sources["usgs-topo-medium-zoom"] = {
    type: "raster",
    url: usgsTopoUrl(urls.medium[mosaic_choice]),
    attribution: '<a href="https://www.usgs.gov/" target="_blank">© USGS</a>',
  };
  defaultMapStyle.sources["usgs-topo-high-zoom"] = {
    type: "raster",
    url: usgsTopoUrl(urls.high[mosaic_choice]),
    attribution: '<a href="https://www.usgs.gov/" target="_blank">© USGS</a>',
  };
  return Map(defaultMapStyle);
}

function belowMinZoom(scale_choice, zoom) {
  if (zoom >= 10.5) {
    return false;
  }
  if (scale_choice === "medium" && zoom >= 8.5) {
    return false;
  }
  if ((scale_choice === "low" || scale_choice === "auto") && zoom >= 6.5) {
    return false;
  }
  return true;
}

class App extends React.Component {
  state = {
    viewport: {
      ...defaultViewport,
      ...getViewStateFromHash(window.location.hash),
    },
    // Choice of either "oldest" or "newest" mosaic
    mosaic_choice: "oldest",
    // Choice of either "auto", "low", "medium", or "high" scale
    scale_choice: "auto",
    opacity: 1,
    terrainRelief: true,
    mapStyle: constructMapStyle("oldest"),
    optionsExpanded: false,
  };

  _toggleState = (name) => {
    this.setState((prevState) => ({
      [name]: !prevState[name],
    }));
  };

  _onChangeOpacity = (e, { name, value }) => {
    this.setState({ [name]: Number(value) });
  };

  render() {
    const {
      mosaic_choice,
      scale_choice,
      viewport,
      opacity,
      terrainRelief,
      mapStyle,
      optionsExpanded,
    } = this.state;
    const { latitude, zoom } = viewport;
    return (
      <div>
        <ReactMapGL
          {...viewport}
          width="100vw"
          height="100vh"
          mapOptions={{ hash: true }}
          mapStyle={mapStyle}
          onViewportChange={(viewport) => this.setState({ viewport })}
        >
          <Layer
            maxzoom={scale_choice === "auto" ? 10 : 24}
            source="usgs-topo-low-zoom"
            id="usgs-topo-low-zoom-layer"
            type="raster"
            beforeId="place_other"
            paint={{
              "raster-opacity": opacity,
            }}
            layout={{
              visibility:
                scale_choice === "auto" || scale_choice === "low"
                  ? "visible"
                  : "none",
            }}
          />

          <Layer
            minzoom={scale_choice === "auto" ? 10 : 0}
            // Use mid-scale maps in Alaska on auto
            maxzoom={scale_choice === "auto" && latitude <= 50 ? 12 : 24}
            source="usgs-topo-medium-zoom"
            id="usgs-topo-medium-zoom-layer"
            type="raster"
            beforeId="place_other"
            paint={{
              "raster-opacity": opacity,
            }}
            layout={{
              visibility:
                scale_choice === "auto" || scale_choice === "medium"
                  ? "visible"
                  : "none",
            }}
          />
          <Layer
            minzoom={scale_choice === "auto" ? 12 : 0}
            source="usgs-topo-high-zoom"
            id="usgs-topo-high-zoom-layer"
            type="raster"
            beforeId="place_other"
            paint={{
              "raster-opacity": opacity,
            }}
            layout={{
              visibility:
                scale_choice === "auto" || scale_choice === "high"
                  ? "visible"
                  : "none",
            }}
          />

          <Source
            id="terrarium"
            type="raster-dem"
            minzoom={0}
            maxzoom={15}
            tileSize={256}
            encoding="terrarium"
            tiles={[
              "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
            ]}
          >
            <Layer
              id="terrarium-layer"
              type="hillshade"
              paint={{
                "hillshade-shadow-color": "hsl(39, 21%, 33%)",
                "hillshade-illumination-anchor": "map",
                "hillshade-illumination-direction": 315,
                "hillshade-exaggeration": 0.3,
              }}
              layout={{
                visibility: terrainRelief ? "visible" : "none",
              }}
              beforeId="place_other"
            />
          </Source>

          <div style={{ position: "absolute", right: 10, top: 10 }}>
            <NavigationControl />
          </div>

          <div style={{ position: "absolute", bottom: 10, left: 10 }}>
            <ScaleControl maxWidth={100} unit={"imperial"} />
          </div>
        </ReactMapGL>
        <Container
          style={{
            position: "absolute",
            width: 280,
            maxWidth: 500,
            left: 10,
            top: 10,
            maxHeight: "70%",
            zIndex: 1,
            backgroundColor: "#fff",
            pointerEvents: "auto",
            overflowY: "auto",
            overflow: "visible",
          }}
        >
          <Accordion as={Card} style={{ padding: 5 }}>
            <Accordion.Title
              as={Card.Header}
              as="h3"
              textAlign="center"
              active={optionsExpanded}
              index={0}
              onClick={() => this._toggleState("optionsExpanded")}
            >
              <Icon name="dropdown" />
              USGS Historical Topographic Maps
            </Accordion.Title>
            <Accordion.Content active={optionsExpanded}>
              <p>
                The entire USGS archive of 183,000 digitized maps created
                between 1884 and 2006 is publicly accessible online. Explore a
                portion interactively here.
              </p>

              {belowMinZoom(scale_choice, zoom) && (
                <p>Zoom in or change map scale to see map</p>
              )}
              <Select
                style={{ width: "100%" }}
                options={mosaicChoiceOptions}
                value={mosaic_choice}
                onChange={(e, data) =>
                  this.setState({
                    mosaic_choice: data.value,
                    mapStyle: constructMapStyle(data.value),
                  })
                }
              />
              <Select
                style={{ width: "100%" }}
                options={scaleChoiceOptions}
                value={scale_choice}
                onChange={(e, data) =>
                  this.setState({ scale_choice: data.value })
                }
              />

              <Checkbox
                label="Terrain relief shading"
                onChange={() => this._toggleState("terrainRelief")}
                checked={terrainRelief}
                style={{ padding: 5 }}
              />
            </Accordion.Content>
          </Accordion>
        </Container>
      </div>
    );
  }
}

export default App;
