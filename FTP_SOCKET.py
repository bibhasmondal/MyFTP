import os
from os import listdir
from os.path import isfile, join
import websocket
import json
import base64
import magic
import random
from django.core.files.base import ContentFile
mime = magic.Magic(mime=True)
class MyFTP:
    ws=None
    message=None
    fileId=0
    def __init__(self,ws,message):
        self.ws=ws
        self.message=message
        self.getContent(message['message'])


    def send(self,message):
        try:        
            self.ws.send(json.dumps({'reply_channel': self.message['reply_channel'], 'message': message}))
        except Exception as e:
            print(e)
            return False

    def isReadable(self,filePath):
        if mime.from_file(filePath).find('pdf') != -1 or mime.from_file(filePath).find('image') != -1 or mime.from_file(filePath).find('text') != -1:
            return True
        else:
            return False

    def getFileContent(self,filePath):
        with open(filePath, 'rb', buffering=4096000) as fp:
            #send(base64.b64encode(data).decode())
            #f1 = ContentFile(base64.b64encode(fp.read()).decode())
            fileContent = fp.read(409600)
            data = base64.b64encode(fileContent).decode()
            downloadedChunk=len(fileContent)
            self.send({'fileName': filePath.split(
                '/')[-1],'fileId':str(random.randint(500,990)*189),'fileSize': os.stat(filePath).st_size,
                       'contentType': 'file', 'message': 'start'})
            while data:
                print(int(downloadedChunk*100/os.stat(filePath).st_size))
                self.send({'contentType': 'file',
                           'currentDownloaded': int(downloadedChunk*100/os.stat(filePath).st_size), 'message': data})
                fileContent = fp.read(409600)
                downloadedChunk += len(fileContent)
                data = base64.b64encode(fileContent).decode()
            self.send({'contentType': 'file','isReadable':self.isReadable(filePath),'mime': mime.from_file(filePath), 'message': 'finish'})
            fp.close()

    def getFolderContent(self,folderPath):
        contents=listdir(folderPath)
        for content in contents:
            self.send({'contentType': 'folder','class':'file' if isfile(os.path.join(folderPath,content)) else 'dir','message': content})

    def getContent(self,path):
        if isfile(path):
            self.getFileContent(path)
        else:
            self.getFolderContent(path)

'''if __name__ == "__main__":
    ws = websocket.create_connection("ws://127.0.0.1:8080")
    MyFTP(ws).getContent("E:/Softwares/QHTS64.exe")'''
