import websocket
import threading
from FTP_SOCKET import MyFTP
try:
    import thread
except ImportError:
    import _thread as thread
import time
import os
import json


class Websocket():
    wsobject = None
    url = None
    connected = False

    def __init__(self, url):
        self.url = url
        threading.Timer(0.0, self.__init__, args=(url,)).start()
        if not self.connected:
            self.wsobject = None
            self.wsobject = websocket.WebSocketApp(url,
                                                   on_message=self.on_message,
                                                   on_error=self.on_error,
                                                   on_close=self.on_close)
            self.wsobject.on_open = self.on_open
            self.connected = True
            self.wsobject.run_forever()

    def on_message(self, ws, message):
        thread.start_new_thread(MyFTP,
                                (ws,json.loads(message),))

    def on_error(self, ws, error):
        self.connected = False

    def on_close(self, ws):
        self.connected = False

    def on_open(self, ws):
        pass


if __name__ == "__main__":
    Websocket("ws://127.0.0.1:8080?apikey=master")
