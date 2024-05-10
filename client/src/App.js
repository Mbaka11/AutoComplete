import axios from "axios";
import { useEffect, useState } from "react";
import "./App.css";

const App = () => {
  const [chosenType, setChosenType] = useState(null);
  const [chosenMag, setChosenMag] = useState(null);
  const [chosenLocation, setChosenLocation] = useState(null);
  const [chosenDateRange, setChosenDateRange] = useState(null);
  const [chosenSortOption, setchosenSortOption] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const result = await sendLocationSuggestionsRequest();
        if (result) {
          setSuggestions(result.map((bucket) => bucket.key));
          console.log("suggestions", suggestions);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchSuggestions();
  }, [chosenLocation]);

  const sendLocationSuggestionsRequest = (location) => {
    const params = {};
    if (chosenLocation) params.location = chosenLocation;

    const results = {
      method: "GET",
      url: "http://localhost:5000/location-suggestions",
      params,
    };

    return axios
      .request(results)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const sendSearchRequest = () => {
    const params = {};
    if (chosenType) params.type = chosenType;
    if (chosenMag) params.mag = chosenMag;
    if (chosenLocation) params.location = chosenLocation;
    if (chosenDateRange) params.dateRange = chosenDateRange;
    if (chosenSortOption) params.sortOption = chosenSortOption;

    console.log("params", params);
    const results = {
      method: "GET",
      url: "http://localhost:5000/results",
      params,
    };

    axios
      .request(results)
      .then((response) => {
        setDocuments(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div className="app">
      <nav>
        <ul className="nav-bar">
          <li>Earthquake Watch</li>
        </ul>
      </nav>
      <p className="directions">
        Search for earthquakes using the following criteria:
      </p>
      <div className="main">
        <div className="type-selector">
          <ul>
            <li>
              <select
                name="types"
                id="types"
                value={chosenType}
                onChange={(e) => setChosenType(e.target.value)}
              >
                <option value="">Select a Type</option>
                <option value="earthquake">Earthquake</option>
                <option value="quarry blast">Quarry Blast</option>
                <option value="ice quake">Ice Quake</option>
                <option value="explosion">Explosion</option>
              </select>
            </li>
            <li>
              <select
                name="mag"
                id="mag"
                value={chosenMag}
                onChange={(e) => {
                  setChosenMag(e.target.value);
                  console.log("chosenMag", e.target.value);
                }}
              >
                <option value="">Select magnitude level</option>
                <option value="2.5">2.5+</option>
                <option value="5.5">5.5+</option>
                <option value="6.1">6.1+</option>
                <option value="7">7+</option>
                <option value="8">8+</option>
              </select>
            </li>
            <li>
              <form>
                <label>
                  <input
                    className="form"
                    type="text"
                    placeholder="Enter city, state, country"
                    value={chosenLocation}
                    onChange={(e) => {
                      setChosenLocation(e.target.value);
                    }}
                  />
                </label>
              </form>
              {suggestions.length > 0 && (
                <button onClick={() => setShowSuggestions(!showSuggestions)}>
                  {showSuggestions ? "Hide Suggestions" : "Show Suggestions"}
                </button>
              )}
              {suggestions.length > 0 && showSuggestions && (
                <div className="suggestions">
                  {suggestions.map((suggestion) => (
                    <p
                      onClick={() => {
                        setChosenLocation(suggestion);
                        setShowSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </p>
                  ))}
                </div>
              )}
            </li>
            <li>
              <select
                name="dateRange"
                id="dateRange"
                value={chosenDateRange}
                onChange={(e) => setChosenDateRange(e.target.value)}
              >
                <option value="">Select date range</option>
                <option value="7">Past 7 Days</option>
                <option value="14">Past 14 Days</option>
                <option value="21">Past 21 Days</option>
                <option value="30">Past 30 Days</option>
              </select>
            </li>
            <li>
              <select
                name="sortOption"
                id="sortOption"
                value={chosenSortOption}
                onChange={(e) => setchosenSortOption(e.target.value)}
              >
                <option value="">Sort by</option>
                <option value="desc">Largest Magnitude First</option>
                <option value="asc">Smallest Magnitude First</option>
              </select>
            </li>
            <li>
              <button onClick={sendSearchRequest}>Search</button>
            </li>
          </ul>
        </div>
        {documents && (
          <div className="search-results">
            {documents.length > 0 ? (
              <p> Number of hits: {documents.length}</p>
            ) : (
              <p className="no-result-message">
                No results found. Try broadening your search criteria.
              </p>
            )}
            {documents.map((document) => (
              <div className="results-card">
                <div className="results-text">
                  <p>Type: {document._source.type}</p>
                  <p>Time: {document._source["@timestamp"]}</p>
                  <p>Location: {document._source.place}</p>
                  <p>Latitude: {document._source.coordinates.lat}</p>
                  <p>Longitude: {document._source.coordinates.lon}</p>
                  <p>Magnitude: {document._source.mag}</p>
                  <p>Depth: {document._source.depth}</p>
                  <p>Significance: {document._source.sig}</p>
                  <p>Event URL: {document._source.url}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
