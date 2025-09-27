#!/usr/bin/env bash
python -m venv .venv
source .venv/bin/activate || .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your MySQL credentials, then:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
