from flask import Flask, jsonify, request
from elasticsearch import Elasticsearch, helpers
from flask_cors import CORS
import json
import requests
import os

app = Flask(__name__)
CORS(app)

# ElasticSearch Connection
with open('../config/default.json') as f:
    config = json.load(f)

elastic_config = config['elastic']

# Create the Elasticsearch client
es = Elasticsearch(
    cloud_id=elastic_config['cloudID'],
    http_auth=(elastic_config['username'], elastic_config['password'])
)

if es.ping():
    print('Connected to ElasticSearch')
else:
    print('Could not connect to ElasticSearch')

def get_client():
    return es

@app.route('/earthquakes', methods=['GET'])
def get_earthquakes():
    URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson'
    response = requests.get(URL)
    data = response.json()

    actions = [
        {
            "_index": "earthquakes",
            "_id": earthquake["id"],
            "_source": {
                "place": earthquake["properties"]["place"],
                "time": earthquake["properties"]["time"],
                "tz": earthquake["properties"]["tz"],
                "url": earthquake["properties"]["url"],
                "detail": earthquake["properties"]["detail"],
                "felt": earthquake["properties"]["felt"],
                "cdi": earthquake["properties"]["cdi"],
                "alert": earthquake["properties"]["alert"],
                "status": earthquake["properties"]["status"],
                "tsunami": earthquake["properties"]["tsunami"],
                "sig": earthquake["properties"]["sig"],
                "net": earthquake["properties"]["net"],
                "code": earthquake["properties"]["code"],
                "sources": earthquake["properties"]["sources"],
                "nst": earthquake["properties"]["nst"],
                "dmin": earthquake["properties"]["dmin"],
                "rms": earthquake["properties"]["rms"],
                "mag": earthquake["properties"]["mag"],
                "magType": earthquake["properties"]["magType"],
                "type": earthquake["properties"]["type"],
                "longitude": earthquake["geometry"]["coordinates"][0],
                "latitude": earthquake["geometry"]["coordinates"][1],
                "depth": earthquake["geometry"]["coordinates"][2],
            },
            "pipeline": "earthquake_data_pipeline"
        }
        for earthquake in data["features"]
    ]

    helpers.bulk(es, actions)

    return jsonify({"message": "Data has been indexed successfully!"})

@app.route('/results', methods=['GET'])
def get_results():
    passed_type = request.args.get('type')
    passed_mag = request.args.get('mag')
    passed_location = request.args.get('location')
    passed_date_range = request.args.get('dateRange')
    passed_sort_option = request.args.get('sortOption')
    print("passed_sort_option")
    print(passed_sort_option)

    filters = []
    if passed_type:
        filters.append({"term": {"type": passed_type}})
    if passed_mag:
        filters.append({"range": {"mag": {"gte": passed_mag}}})
    if passed_location:
        filters.append({"match_phrase_prefix": {"place": passed_location}})
    if passed_date_range:
        filters.append({"range": {"@timestamp": {"gte": f"now-{passed_date_range}d/d", "lt": "now/d"}}})
    if not passed_sort_option:
        passed_sort_option = "desc"

    body = es.search(
        index="earthquakes",
        body={
            "sort": [
                {
                    "mag": {
                        "order": passed_sort_option
                    }
                }
            ],
            "size": 300,
            "query": {
                "bool": {
                    "filter": filters
                }
            }
        }
    )

    return jsonify(body['hits']['hits'])

@app.route('/location-suggestions', methods=['GET'])
def get_suggestions():
    location = request.args.get('location')
    body = es.search(
        index="earthquakes",
        body={
            "size": 0,
            "aggs": {
                "locations": {
                    "terms": {
                        "field": "place.keyword",
                        "size": 10,
                        "include": f".*{location}.*"
                    }
                }
            }
        }
    )
    
    return jsonify(body['aggregations']['locations']['buckets'])

# Run the server
if __name__ == '__main__':
    # app.run(debug=True)
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)