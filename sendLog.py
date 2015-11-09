import MySQLdb
import sys
from socket import *
import os

server_socket = socket (AF_INET, SOCK_STREAM)
server_socket.bind (("", 5000))
server_socket.listen(5)
# For use DB
db = MySQLdb.connect('localhost', 'root', 'asdf', 'babysleep')
print("db connect")
cursor=db.cursor()
cursor.execute("show databases")
print("show db")
cursor.execute("use babysleep")
print("use babysleep")

while 1:
	client_socket, address = server_socket.accept()
	print ("Connect from", address)
	data = client_socket.recv(1024) # Receive signal from Android (Sleeping data log request message)
	print data
	tmp = '0'	
	if data == '1':
		print ("Now, Sending data to Android")
		cursor.execute ("select * from infosleep") # Extract all data from DB
		row = cursor.fetchall()
		for c in row:
			date = c[0]
			hour = c[2]
			min = c[3]
			sec = c[4]
			wakeUpcnt = c[5]
		
			if date != tmp: # If date is different from previous data
				client_socket.send (str(date)+"/")
				#print date
				idx = 1
			elif date==tmp: # If date is same from previous data, skip date sending
				idx=idx+1	
	
			tmp = date
			client_socket.send ('%d. %dhour %dmin %dsec. %dwake/' % (idx, hour, min, sec, wakeUpcnt))	
		client_socket.close ()
