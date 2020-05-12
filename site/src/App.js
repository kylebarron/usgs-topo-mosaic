import React from "react";
import "./App.css";
import ReactMapGL, {
  Source,
  Layer,
  NavigationControl,
  ScaleControl,
} from "react-map-gl";
import { getViewStateFromHash } from "./util";
import { Checkbox, Card, Select, Header, Container } from "semantic-ui-react";
import { Map } from "immutable";

const defaultMapStyle = require("./style.json");

const defaultViewport = {
  latitude: 37.73817,
  longitude: -119.59118,
  zoom: 12.14,
  bearing: 0,
  pitch: 0,
};

const urls = {
  high: {
    newest: "dynamodb://us-west-2/usgs-topo_high_newest_lower_48.v1",
    oldest: "dynamodb://us-west-2/usgs-topo_high_oldest_lower_48.v1",
  },
  medium: {
    newest: "dynamodb://us-west-2/usgs-topo_medium_newest.v1",
    oldest: "dynamodb://us-west-2/usgs-topo_medium_oldest.v1",
  },
  low: {
    newest: "dynamodb://us-west-2/usgs-topo_low_newest.v1",
    oldest: "dynamodb://us-west-2/usgs-topo_low_oldest.v1",
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

class App extends React.Component {
  state = {
    viewport: {
      ...defaultViewport,
      ...getViewStateFromHash(window.location.hash),
    },
    // Choice of either "oldest" or "newest" mosaic
    mosaic_choice: "newest",
    // Choice of either "auto", "low", "medium", or "high" scale
    scale_choice: "auto",
    opacity: 1,
    terrainRelief: true,
    mapStyle: constructMapStyle("newest"),
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
    } = this.state;
    const { latitude } = viewport;
    return (
      <div>
        <ReactMapGL
          {...this.state.viewport}
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
          }}
        >
          <Card style={{ padding: 5 }}>
            <Header as="h4">
              <Header.Content>
                Serverless USGS Historical Topo Maps
              </Header.Content>
            </Header>

            <Select
              options={mosaicChoiceOptions}
              value={mosaic_choice}
              onChange={(e, data) =>
                this.setState({
                  mosaic_choice,
                  mapStyle: constructMapStyle(data.value),
                })
              }
            />
            <Select
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
          </Card>
        </Container>
      </div>
    );
  }
}

export default App;