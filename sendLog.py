import MySQLdb
import sys
from socket import *
import os

server_socket = socket (AF_INET, SOCK_STREAM)
server_socket.bind (("", 5000))
server_socket.listen(5)

while 1:
	client_socket, address = server_socket.accept()
	print ("Connect from", address)
	data = client_socket.recv(1024)
	print data
	tmp = '0'	
	if data == '1':
		print ("Now, Sending data to Android")
		db = MySQLdb.connect ('localhost', 'root', 'asdf', 'babysleep')
		cursor = db.cursor()
		cursor.execute ("use babysleep")
		cursor.execute ("select * from infosleep")
		row = cursor.fetchall()
			
		#db2 = MySQLdb.connect ('localhost', 'root', 'asdf', 'babysleep')
		#cursor2 = db2.cursor()
		str2 = "select * from infosleep ORDER BY idx"
		cursor.execute(str2)
		result = cursor.fetchall()	
		total = cursor.rowcount

		if total == 1:
			tmp = '0'
			print "Total is 1"

		for c in row:
			date = c[0]
			hour = c[2]
			min = c[3]
			sec = c[4]
			wakeUpcnt = c[5]
		
			if date != tmp:
				client_socket.send (str(date)+"/")
				#print date
				idx = 1
			elif date==tmp:
				idx=idx+1	
	
			tmp = date
			client_socket.send ('%d. %dhour %dmin %dsec. %dwake/' % (idx, hour, min, sec, wakeUpcnt))	
			#print "%d. %dhour %dmin %dsec %dwake"  % (idx, hour, min, sec, wakeUpcnt)  
		db.commit()
		client_socket.close ()
