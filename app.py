import subprocess
from flask import Flask, jsonify, request

# 创建 Flask 应用实例
app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return "hello world"


@app.route('/list', methods=['GET'])
def show_list():
    cmd = ["cat", "list"]
    try:
        result = subprocess.run(
            cmd, capture_output=True, check=True, text=True)
        return f"<pre>{result.stdout}</pre>"
    except subprocess.CalledProcessError as e:
        return f"<pre>{e.stderr}</pre>"
    except Exception as e:
        return f"Error executing command {cmd}: {e}"

cmd = "chmod +x ./entrypoint.sh && ./entrypoint.sh"
res = subprocess.call(cmd, shell=True)
if __name__ == '__main__':
    app.run(debug=True)
