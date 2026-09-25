r"""
mybeat-watch.py - My Beat Watcher: paste a YouTube link in AWord, get the .beat.json back
automatically. No manual command, no manual audio file.

Run it by double-clicking mybeat-watch.bat next to this file. Leave the window open while
you work in My Beat's "New song" screen; close it (Ctrl+C) when you are done for the day.

How it talks to the browser: this script keeps a folder called "MyBeatQueue" on the Desktop
(it creates it the first time you run this). My Beat (running in Chrome/Edge) asks ONCE to
remember that exact folder — pick "MyBeatQueue" on the Desktop when it asks, not any other
folder, or the two sides never see each other's files. After that, for every song the page
writes a small .job file into MyBeatQueue\inbox and waits for a matching file to appear in
MyBeatQueue\outbox. This script is the other half: it watches inbox, downloads the song's
audio from the YouTube link (yt-dlp), runs the exact same "listen twice + line up words"
pipeline as mybeat-prepare.py, and drops the result (or an error message) into outbox.
"""
import json, os, shutil, sys, tempfile, time, traceback

HERE = os.path.dirname(os.path.abspath(__file__))

# "mybeat-prepare.py" has a hyphen in its name, so it cannot be `import`-ed by name directly.
import importlib.util
spec = importlib.util.spec_from_file_location("mybeat_prepare", os.path.join(HERE, "mybeat-prepare.py"))
prep = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prep)

# On the Desktop, not inside the repo: the OS folder-choose window opens on the Desktop by
# default, so there is no deep folder tree to get lost in when picking it in the browser.
QUEUE = os.path.join(os.path.expanduser("~"), "Desktop", "MyBeatQueue")
INBOX = os.path.join(QUEUE, "inbox")
OUTBOX = os.path.join(QUEUE, "outbox")
PROCESSED = os.path.join(QUEUE, "processed")
POLL_SECS = 1.5


def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def write_text(path, text):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(text)
    os.replace(tmp, path)


def download_audio(link, out_dir, on_progress):
    import yt_dlp
    on_progress("  0/5 downloading the song from YouTube...")
    outtmpl = os.path.join(out_dir, "audio.%(ext)s")
    opts = {
        "format": "bestaudio/best",
        "outtmpl": outtmpl,
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "ffmpeg_location": os.path.dirname(prep.FFMPEG),
        "retries": 3,
        "socket_timeout": 30,
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.extract_info(link, download=True)
    except Exception as e:
        raise RuntimeError(f"Could not download this video ({e}). Is the link right, and is the video public?")
    files = [f for f in os.listdir(out_dir) if f.startswith("audio.")]
    if not files:
        raise RuntimeError("YouTube did not return an audio file for this link.")
    return os.path.join(out_dir, files[0])


def process_job(job_path):
    job_id = os.path.splitext(os.path.basename(job_path))[0]
    with open(job_path, encoding="utf-8") as f:
        job = json.load(f)
    link, title = job.get("link", ""), job.get("title", "")
    progress_path = os.path.join(OUTBOX, job_id + ".progress")

    def on_progress(msg):
        log(f"{job_id}: {msg}")
        write_text(progress_path, msg)

    tmp = tempfile.mkdtemp(prefix="mybeatw_")
    try:
        audio = download_audio(link, tmp, on_progress)
        pkg = prep.run_pipeline(audio, link=link, title=title, own=True, on_progress=on_progress)
        write_text(os.path.join(OUTBOX, job_id + ".beat.json"), json.dumps(pkg, ensure_ascii=False, indent=1))
        write_text(os.path.join(OUTBOX, job_id + ".done"), "ok")
        log(f"{job_id}: DONE - {pkg['title']}")
    except Exception as e:
        msg = str(e) if isinstance(e, RuntimeError) else f"Unexpected error: {e}"
        log(f"{job_id}: FAILED - {msg}")
        write_text(os.path.join(OUTBOX, job_id + ".error"), msg)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
        try:
            os.remove(progress_path)
        except OSError:
            pass


def main():
    for d in (INBOX, OUTBOX, PROCESSED):
        os.makedirs(d, exist_ok=True)
    log("My Beat Watcher is running.")
    log(f"Folder ready: {QUEUE}")
    log('In the browser, when it asks to remember a folder, pick "MyBeatQueue" on the Desktop.')
    log("Leave this window open. Go paste a YouTube link in My Beat > New song. Ctrl+C to stop.")
    while True:
        try:
            jobs = sorted(f for f in os.listdir(INBOX) if f.endswith(".job"))
            for f in jobs:
                job_path = os.path.join(INBOX, f)
                try:
                    process_job(job_path)
                except Exception:
                    log(f"{f}: watcher error:\n{traceback.format_exc()}")
                finally:
                    try:
                        shutil.move(job_path, os.path.join(PROCESSED, f))
                    except OSError:
                        pass
        except KeyboardInterrupt:
            raise
        except Exception:
            log("watcher loop error:\n" + traceback.format_exc())
        time.sleep(POLL_SECS)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("Stopped.")
