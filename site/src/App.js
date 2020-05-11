import React from "react";
import "./App.css";
import ReactMapGL, { Source, Layer } from "react-map-gl";
import { getViewStateFromHash } from "./util";

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
  };

  usgsTopoUrl = (url) => {
    const params = {
      url,
      tile_scale: 2,
      tile_format: "jpg",
    };
    const searchParams = new URLSearchParams(params);
    let baseUrl =
      "https://us-west-2-lambda.kylebarron.dev/usgs-topo/tilejson.json?";
    baseUrl += searchParams.toString();
    return baseUrl;
  };

  render() {
    const { mosaic_choice, scale_choice, viewport } = this.state;
    const { latitude } = viewport;
    return (
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
          url={this.usgsTopoUrl(urls.low[mosaic_choice])}
        >
          <Layer
            maxzoom={scale_choice === "auto" ? 10 : 24}
            id="usgs-topo-low-zoom-layer"
            type="raster"
            beforeId="place_other"
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
          url={this.usgsTopoUrl(urls.medium[mosaic_choice])}
        >
          <Layer
            minzoom={scale_choice === "auto" ? 10 : 0}
            // Use mid-scale maps in Alaska on auto
            maxzoom={scale_choice === "auto" && latitude <= 50 ? 12 : 24}
            id="usgs-topo-medium-zoom-layer"
            type="raster"
            beforeId="place_other"
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
          url={this.usgsTopoUrl(urls.high[mosaic_choice])}
        >
          <Layer
            minzoom={scale_choice === "auto" ? 12 : 0}
            id="usgs-topo-high-zoom-layer"
            type="raster"
            beforeId="place_other"
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
            beforeId="place_other"
          />
        </Source>
      </ReactMapGL>
    );
  }
}

export default App;
