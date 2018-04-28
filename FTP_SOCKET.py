import os
from os import listdir
from os.path import isfile, join, getmtime, getsize
import websocket
import json
import base64
import magic
import random
from time import ctime
mime = magic.Magic(mime=True)
GB = 1024*1024*1024
class MyFTP:
    ws=None
    message=None
    fileId=0
    def __init__(self,ws,message):
        self.ws=ws
        self.message=message
        self.getContent(message['message'])

    def getProperSize(self,size):
        if size>=GB:
            return format(size/GB,'.2f')+'GB'
        elif size>GB/1024:
            return format(size/(GB/1024),'.2f')+'MB'
        elif size>=1024:
            return format(size/1024,'.2f')+'KB'
        else:
            return format(size,'.2f')+'B'
        


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
            fileContent = fp.read(409600)
            data = base64.b64encode(fileContent).decode()
            downloadedChunk=len(fileContent)
            self.send({'fileName': filePath.split(
                '/')[-1],'fileId':str(random.randint(500,990)*189),'fileSize': os.stat(filePath).st_size,'message': 'start'})
            while data:
                print(int(downloadedChunk*100/os.stat(filePath).st_size))
                self.send({'currentDownloaded': int(downloadedChunk*100/os.stat(filePath).st_size), 'message': data})
                fileContent = fp.read(409600)
                downloadedChunk += len(fileContent)
                data = base64.b64encode(fileContent).decode()
            self.send({'isReadable':self.isReadable(filePath),'mime': mime.from_file(filePath), 'message': 'finish'})
            fp.close()

    def getFolderContent(self,folderPath):
        contents=listdir(folderPath)
        for content in contents:
            if isfile(join(folderPath, content)):
                self.send({'size': self.getProperSize(getsize(join(folderPath, content))), 'lastModified': ctime(getmtime(join(folderPath, content))),
                    'class': 'file', 'message': content})
            else:
                self.send({'size':'','lastModified': ctime(getmtime(join(folderPath, content))),
                           'class': 'dir', 'message': content})

    def getContent(self,path):
        if isfile(path):
            self.getFileContent(path)
        else:
            self.getFolderContent(path)

'''if __name__ == "__main__":
    ws = websocket.create_connection("ws://127.0.0.1:8080")
    MyFTP(ws).getContent("E:/Softwares/QHTS64.exe")'''
