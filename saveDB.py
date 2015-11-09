import socket
import MySQLdb
import sys
import os
import time
# For use DB
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.bind(("", 5001))
server_socket.listen(10)
print("waiting...")

db = MySQLdb.connect('localhost', 'root', 'asdf', 'babysleep')
print("db connect")
cursor=db.cursor()

cursor.execute("use babysleep")
print("use babysleep")

while 1:
	client_socket, address = server_socket.accept()
	print ("connect from", address)
	buffer = client_socket.recv(20000) # Receive sleeping data from server
	print buffer
	data1 = buffer.split ('.')
	date = data1[0]
	hour = int(data1[1])
	min = int(data1[2])
	sec = int(data1[3])
	wakeUpCnt = int(data1[4])

	str = "select * from infosleep ORDER BY idx"
	cursor.execute(str)
	result = cursor.fetchall()
	total = cursor.rowcount

	if total > 100: # If index is over 100, reset the table
		str = "delete from infosleep"
		cursor.execute(str)
		db.commit()
		str = "alter table infosleep auto_increment=1"
		cursor.execute(str)
		db.commit()
	# Insert baby's sleeping data
	str = "insert into infosleep(date, hour, min, sec, wakeUpCnt) values(%s, %d, %d, %d, %d)" % (date, hour, min, sec, wakeUpCnt)
	cursor.execute(str)
	db.commit()
