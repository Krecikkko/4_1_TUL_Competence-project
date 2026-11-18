# Analysis module — NetGuard detection engine

The `analysis` module is NetGuard's detection engine. It runs in a loop:

1. it receives normalized network flows from the Kafka topic **`flows.normalized`**,
2. it analyzes them in time windows (1 s, 10 s, 60 s) looking for anomalies,
3. it publishes any alerts it raises to the Kafka topic **`detections.created`**.

This guide walks you through running the module on your own machine step by step, even if you have never worked with Python or Kafka before.

---

## Table of contents

1. [What you need](#1-what-you-need)
2. [Installing Python 3.14](#2-installing-python-314)
3. [Creating a virtual environment (venv)](#3-creating-a-virtual-environment-venv)
4. [Installing dependencies](#4-installing-dependencies)
5. [Starting Kafka](#5-starting-kafka)
6. [Running the module](#6-running-the-module)
7. [Stopping and restarting](#7-stopping-and-restarting)
8. [Troubleshooting](#8-troubleshooting)
9. [File overview](#9-file-overview)

---

## 1. What you need

| Tool | What it's for |
|---|---|
| **Python 3.14** | The language the module is written in. |
| **Git** | To get the repository. |
| **Docker + Docker Compose v2** | To run the Kafka broker the module talks to. |
| A terminal | On Linux/macOS the regular terminal; on Windows **PowerShell** or **WSL**. |

> You type every command in this guide into a terminal. Lines starting with `#` inside code blocks are comments — you don't need to type them.

---

## 2. Installing Python 3.14

The project is developed and tested on **Python 3.14**. Older versions (3.10 and newer) will probably work, but to avoid surprises, use 3.14.

Check which version you have installed:

```bash
# Linux / macOS / WSL
python3.14 --version

# Windows (PowerShell)
py -3.14 --version
```

If you see something like `Python 3.14.x`, you're all set — skip to step 3.

If the command is not found, install Python 3.14:

- **Windows:** download the installer from <https://www.python.org/downloads/>. During installation, **tick "Add python.exe to PATH"**.
- **macOS:** download the installer from <https://www.python.org/downloads/> or use Homebrew: `brew install python@3.14`.
- **Ubuntu / Debian / WSL:** the easiest route is `uv` or `pyenv`, for example:

  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  uv python install 3.14
  ```

  (or from the deadsnakes PPA: `sudo add-apt-repository ppa:deadsnakes/ppa && sudo apt install python3.14 python3.14-venv`).

After installing, close and reopen your terminal, then check the version again.

---

## 3. Creating a virtual environment (venv)

A **virtual environment (venv)** is a separate, "private" folder holding Python and the libraries for this project only. Libraries you install here won't mix with other projects or with your system Python.

First, go to the module folder (this assumes you've already cloned the repository):

```bash
cd path/to/4_1_TUL_Competence-project/modules/analysis
```

Create the venv in a folder called `.venv`:

```bash
# Linux / macOS / WSL
python3.14 -m venv .venv

# Windows (PowerShell)
py -3.14 -m venv .venv
```

Now **activate** it:

```bash
# Linux / macOS / WSL
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Windows (cmd.exe)
.venv\Scripts\activate.bat
```

Once activated, `(.venv)` appears at the start of your terminal prompt. That means `python` and `pip` now use the Python from this environment. You can check:

```bash
python --version   # should print Python 3.14.x
```

> **Windows — "running scripts is disabled on this system"?** Run this once in PowerShell:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then try activating again.

> The `.venv` folder is ignored by Git (`.gitignore`), so it never ends up in the repository. Everyone creates their own.

**Remember:** you need to activate the venv **in every new terminal window** before running the module.

---

## 4. Installing dependencies

With the venv active (you see `(.venv)` in your prompt) and while in the `modules/analysis` folder, run:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

This installs the libraries listed in [`requirements.txt`](requirements.txt):

| Library | What it's for |
|---|---|
| `confluent-kafka` | Kafka client — receiving flows and sending alerts. |
| `multiset` | Data structures used when computing statistics. |
| `numpy` | Numerical computations. |

Check that everything installed correctly:

```bash
python -c "import confluent_kafka, multiset, numpy; print('OK')"
```

If you see `OK`, you're done.

---

## 5. Starting Kafka

The module connects to Kafka at **`localhost:9094`**. Kafka runs in Docker and is started from the **repository root** (not from `modules/analysis`).

Open a **second terminal window** and run:

```bash
cd path/to/4_1_TUL_Competence-project

# Start the Kafka broker and create the topics (flows.normalized, detections.created, ...)
docker compose up -d kafka kafka-init
```

Check that Kafka is running:

```bash
docker compose ps -a
```

The `kafka` service should be `healthy`, and `kafka-init` should show `Exited (0)` — it's a one-off job that creates the topics, so exiting is expected.

> Want to browse messages in your browser? Start the Kafka UI panel:
> `docker compose --profile tools up -d kafka-ui` and open <http://localhost:8085>.

See the main [README](../../README.md) for more about the full platform (backend, database, etc.).

---

## 6. Running the module

Go back to the first terminal (with the venv active) and make sure you're in the `modules/analysis` folder. The module imports its files from the current directory, so it has to be run from here.

```bash
python main.py
```

If everything works, you'll see:

```text
NetGuard Detection Engine started...
```

From now on the module waits for flows on the `flows.normalized` topic. When a flow is classified as suspicious, an alert is published to `detections.created` (you can see it in Kafka UI).

> It's normal for nothing else to appear in the terminal — the module is just listening. Flows come from other modules (e.g. `pcap-importer`), or you can send test messages yourself, e.g. with the scripts in [`examples/kafka`](../../examples/kafka).

---

## 7. Stopping and restarting

- **Stop the module:** press `Ctrl+C` in the terminal it's running in. You'll see `NetGuard Detection Engine stopped.`
- **Leave the venv:** type `deactivate`.
- **Stop Kafka:** run `docker compose down` from the repository root.

**Next time** (venv and dependencies are already installed):

```bash
# Terminal 1 — from the repository root
docker compose up -d kafka kafka-init

# Terminal 2 — the module
cd modules/analysis
source .venv/bin/activate        # Windows: .venv\Scripts\Activate.ps1
python main.py
```

---

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| `python3.14: command not found` / `py: command not found` | Python 3.14 isn't installed or isn't on your PATH — go back to [step 2](#2-installing-python-314). |
| `ModuleNotFoundError: No module named 'confluent_kafka'` (or `numpy`, `multiset`) | The venv isn't active or the dependencies weren't installed. Activate the venv and repeat [step 4](#4-installing-dependencies). |
| `ModuleNotFoundError: No module named 'kafkaReciever'` (or another module file) | You're running `main.py` from a different folder. Go to `modules/analysis` and run `python main.py`. |
| `Connect to ipv4#127.0.0.1:9094 failed: Connection refused` | Kafka isn't running. Start it ([step 5](#5-starting-kafka)) and check `docker compose ps -a`. |
| `Subscribed topic not available: flows.normalized` | The topics weren't created. Run `docker compose up -d kafka-init` again. |
| `pip install confluent-kafka` fails (build errors, missing `librdkafka`) | Upgrade pip (`python -m pip install --upgrade pip`) and try again. If that doesn't help, make sure you're using Python 3.14 from the venv (`python --version`). |
| `Message processing error: ...` in the console | A message on `flows.normalized` has a different format than the module expects (see `WebData.py`). The module skips that message and keeps running. |

---

## 9. File overview

| File | Description |
|---|---|
| `main.py` | Entry point — the loop: receive a flow → analyze it → send alerts. |
| `kafkaReciever.py` | Kafka consumer (`flows.normalized`). |
| `kafkaProducer.py` | Kafka producer (`detections.created`). |
| `Decoder.py` | Turns a JSON message from Kafka into a `WebRecordData` object. |
| `WebData.py` | Structure of a single network flow. |
| `FlowHandler.py` | Core flow classification logic. |
| `FlowMemory.py`, `StatisticsList.py` | Storage of flows and statistics across time windows. |
| `FlowDetectionParams.py` | Detection parameters. |
| `AlertCrafter.py`, `AlertData.py`, `AlertParams.py` | Alert creation and structure. |
| `Config.py` | Configuration (time windows, thresholds). |
| `TimeUtils.py` | Time-handling helpers. |
| `requirements.txt` | List of Python dependencies. |
