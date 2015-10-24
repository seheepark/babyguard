#!/usr/bin/python
# Copyright (c) 2014 Adafruit Industries
# Author: Tony DiCola

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

import sys
from socket import *
import Adafruit_DHT
import time

host = '192.168.0.54'
port = 8082
addr = (host,port)

tcpClientSocket = socket(AF_INET, SOCK_STREAM)
tcpClientSocket.connect(addr)

# Parse command line parameters.
sensor_args = { '11': Adafruit_DHT.DHT11,
				'22': Adafruit_DHT.DHT22,
				'2302': Adafruit_DHT.AM2302 }
if len(sys.argv) == 3 and sys.argv[1] in sensor_args:
	sensor = sensor_args[sys.argv[1]]
	pin = sys.argv[2]
else:
	print 'usage: sudo ./Adafruit_DHT.py [11|22|2302] GPIOpin#'
	print 'example: sudo ./Adafruit_DHT.py 2302 4 - Read from an AM2302 connected to GPIO #4'
	sys.exit(1)

# Try to grab a sensor reading.  Use the read_retry method which will retry up
# to 15 times to get a sensor reading (waiting 2 seconds between each retry).

tempIn = 0
humIn = 0
count1 = 0
count2 = 0
count3 = 0
startTimer = time.time()
endTimer = 0

while True:
	humidity, temperature = Adafruit_DHT.read_retry(sensor, pin)

# Note that sometimes you won't get a reading and
# the results will be null (because Linux can't
# guarantee the timing of calls to read the sensor).
# If this happens try again!
	if humidity is not None and temperature is not None:
		#print 'Temperature : {0:0.1f}*C\nHumidity : {1:0.1f}%\n'.format(temperature, humidity)
		#time.sleep(1)
		print temperature
		print humidity

		totalTimer = (endTimer - startTimer) / 4

		if 30 <= temperature and temperature <= 31:
			print 'Temperature is appropriate'

			#endTimer = 0
			#startTimer = 0
			#startTimer = time.time()

			tempIn = 0
			#count1 = 0
			#count3 = 0
		else: 
			print 'Temperature is inappropriate'
			
			#startTimer = time.time()	
			endTimer = time.time()	

			tempIn = 1
			#count1+=1
			#count3+=0.5
		if 80 <= humidity and humidity <= 81:
			print 'Humidity is appropriate'

			#endTimer = 0
			#startTimer = 0	
			#startTimer = time.time()
			
			humIn = 0
			#count2 = 0
			#count3 = 0
		else:
			print 'Humidity is inappropriate'

			#startTimer = time.time()
			endTimer = time.time()

			humIn = 1
			#count2+=1
			#count3+=0.5
		
		if tempIn == 1 and humIn == 0:
			#if totalTimer < 1:
			#	endTimer = time.time()
			if totalTimer >= 1:
			#if count1 == 1 or count1 % 1000 == 0:
				tcpClientSocket.send ('4')
				endTimer = 0
				startTimer = 0
				startTimer = time.time()
		elif humIn == 1 and tempIn == 0:
			#if totalTimer < 1:
			#	endTimer = time.time()
			if totalTimer >= 1:
			#if count2 == 1 or count2 % 1000 == 0:
				tcpClientSocket.send ('5')
				endTimer = 0
				startTimer = 0
				startTimer = time.time()
		elif humIn == 1 and tempIn == 1:
			print totalTimer
			#if totalTimer < 1:
			#	endTimer = time.time()
			if totalTimer >= 1:
			#if count3 == 1 or count3 % 1000 == 0:
				tcpClientSocket.send ('6')
				endTimer = 0
				startTimer = 0
				startTimer = time.time()
#	tempData = format(temperature)
#	humData = format(humidity)
#	print tempData
#	print humData
	#humData = humidity
#	tcpClientSocket.send(tempData)
#	tcpClientSocket.send(humData)
	#tcpClientSocket.send(humData)
	else:
		print 'Failed to get reading. Try again!'
