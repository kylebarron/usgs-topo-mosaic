import React from "react";
import "./App.css";
import ReactMapGL, { Source, Layer } from "react-map-gl";

class App extends React.Component {
  state = {
      viewport: {
        latitude: 37.8,
        longitude: -122.4,
        zoom: 14,
        bearing: 0,
        pitch: 0
      }
    };

  usgsTopoUrl = () => {
    const params = {
      url: "dynamodb://us-west-2/usgs-topo-latest.v1",
    };
    const searchParams = new URLSearchParams(params);
    let baseUrl =
      "https://us-west-2-lambda.kylebarron.dev/usgs-topo/{z}/{x}/{y}@2x.jpg?";
    baseUrl += searchParams.toString();
    return baseUrl;
  }

  render() {
    return (
      <ReactMapGL
        {...this.state.viewport}
        width="100vw"
        height="100vh"
        mapOptions={{ hash: true }}
        mapStyle="https://raw.githubusercontent.com/kylebarron/fiord-color-gl-style/master/style.json"
        onViewportChange={(viewport) => this.setState({ viewport })}
      >
        <Source
          id="usgs-topo"
          type="raster"
          minzoom={11}
          maxzoom={16}
          tiles={[this.usgsTopoUrl()]}
          tileSize={512}
        >
          <Layer id="naip-lambda-layer" type="raster" minzoom={11} />
        </Source>
      </ReactMapGL>
    );
  }
}

export default App;
