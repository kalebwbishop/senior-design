from flask import Flask, request, Response
import requests
import os

app = Flask(__name__)
TARGET_URL = (
    "http://50.5.72.176:5000"  # Replace with the URL you want to forward requests to
)


@app.route(
    "/", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]
)
@app.route("/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
def proxy(path):
    url = f"{TARGET_URL}/{path}"
    print(f"Forwarding request to: {url}")
    headers = {key: value for key, value in request.headers if key != "Host"}
    response = requests.request(
        method=request.method,
        url=url,
        headers=headers,
        data=request.get_data(),
        cookies=request.cookies,
        allow_redirects=False,
    )

    excluded_headers = [
        "content-encoding",
        "content-length",
        "transfer-encoding",
        "connection",
    ]
    headers = [
        (name, value)
        for (name, value) in response.raw.headers.items()
        if name.lower() not in excluded_headers
    ]

    return Response(response.content, response.status_code, headers)


if __name__ == "__main__":
    # Get the port from the environment variable (required for Render)
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=True, host="0.0.0.0", port=port)
