#!/bin/bash
exec ffmpeg -f v4l2 -video_size 640x480 -i /dev/video0 -f alsa -i default output.mkv
