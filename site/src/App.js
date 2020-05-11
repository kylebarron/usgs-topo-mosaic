import React from "react";
import "./App.css";
import ReactMapGL, {
  Source,
  Layer,
  NavigationControl,
  ScaleControl,
} from "react-map-gl";
import { getViewStateFromHash } from "./util";
import { Checkbox, Card, Select, Form, Header } from "semantic-ui-react";

const mapStyle = require("./style.json");

const defaultViewport = {
  latitude: 36.08507,
  longitude: -112.08867,
  zoom: 12.66,
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
    // tile_scale: 2,
    // tile_format: "jpg",
  };
  const searchParams = new URLSearchParams(params);
  const baseUrl =
    "https://us-west-2-lambda.kylebarron.dev/usgs-topo/{z}/{x}/{y}@2x.jpg?";
  return baseUrl + searchParams.toString();
}

function OpacitySlider(props) {
  const { value, name, onChange } = props;

  return (
    <Form.Input
      label={`Opacity: ${value}`}
      min={0}
      max={1}
      name={name}
      onChange={onChange}
      step={0.05}
      type="range"
      value={value}
    />
  );
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
          <Source
            id="usgs-topo-low-zoom"
            type="raster"
            minzoom={7}
            maxzoom={12}
            attribution={
              '<a href="https://www.usgs.gov/" target="_blank">© USGS</a>'
            }
            tiles={[usgsTopoUrl(urls.low[mosaic_choice])]}
          >
            <Layer
              maxzoom={scale_choice === "auto" ? 10 : 24}
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
          </Source>

          <Source
            id="usgs-topo-medium-zoom"
            type="raster"
            minzoom={9}
            maxzoom={14}
            attribution={
              '<a href="https://www.usgs.gov/" target="_blank">© USGS</a>'
            }
            tiles={[usgsTopoUrl(urls.medium[mosaic_choice])]}
          >
            <Layer
              minzoom={scale_choice === "auto" ? 10 : 0}
              // Use mid-scale maps in Alaska on auto
              maxzoom={scale_choice === "auto" && latitude <= 50 ? 12 : 24}
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
          </Source>

          <Source
            id="usgs-topo-high-zoom"
            type="raster"
            minzoom={11}
            maxzoom={16}
            attribution={
              '<a href="https://www.usgs.gov/" target="_blank">© USGS</a>'
            }
            tiles={[usgsTopoUrl(urls.high[mosaic_choice])]}
          >
            <Layer
              minzoom={scale_choice === "auto" ? 12 : 0}
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
          </Source>

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
        <Card
          style={{
            position: "absolute",
            width: 280,
            maxWidth: 500,
            left: 10,
            top: 10,
            padding: 5,
            maxHeight: "70%",
            zIndex: 1,
            backgroundColor: "#fff",
            pointerEvents: "auto",
            overflowY: "auto",
          }}
        >
          <Header as="h4">
            <Header.Content>
              Serverless USGS Historical Topo Maps
            </Header.Content>
          </Header>

          <Select
            options={mosaicChoiceOptions}
            value={mosaic_choice}
            onChange={(e, data) => this.setState({ mosaic_choice: data.value })}
          />
          <Select
            options={scaleChoiceOptions}
            value={scale_choice}
            onChange={(e, data) => this.setState({ scale_choice: data.value })}
          />

          <Checkbox
            label="Terrain relief shading"
            onChange={() => this._toggleState("terrainRelief")}
            checked={terrainRelief}
            style={{ padding: 5 }}
          />
          <OpacitySlider
            name="opacity"
            value={opacity}
            onChange={this._onChangeOpacity}
          />
        </Card>
      </div>
    );
  }
}

export default App;
