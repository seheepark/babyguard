# -*- coding: utf-8 -*-
import sys
from socket import *
import alsaaudio
import time
from scipy import arange, fft, fromstring, roll, zeros

host = '192.168.0.54'
port = 8082
addr = (host,port)

tcpClientSocket = socket(AF_INET, SOCK_STREAM)
tcpClientSocket.connect(addr)
# Setting Sound conditions
fftLen = 2048
shift = 100
signal_scale = 1. / 2000
 
capture_setting = {
    "ch" : 1,
    "fs" : 16000,
    "chunk" : shift
    }
# Capture sounds using PCM
ch = capture_setting["ch"]
fs = capture_setting["fs"]
chunk = capture_setting["chunk"]
inPCM = alsaaudio.PCM(alsaaudio.PCM_CAPTURE)
inPCM.setchannels(ch)
inPCM.setrate(fs)
inPCM.setformat(alsaaudio.PCM_FORMAT_S16_LE)
inPCM.setperiodsize(chunk)
  
signal = zeros(fftLen, dtype = float)

tmpSound = 0
up = 0
down = 0
max = 0
count = 0

while 1: # Check Baby Crying or not
	length, data = inPCM.read()
        num_data = fromstring(data, dtype = "int16")
        signal = roll(signal, - chunk)
        signal[- chunk :] = num_data
        fftspec = fft(signal)
	babySound = abs(fftspec[0]*signal_scale)
	# First, check baby's minimum sound
	if babySound > 10:
		totalStartTimer = time.time() # Timer start
		totalEndTimer = 0
		
		while totalEndTimer - totalStartTimer < 50: # Check during 50 seconds
			totalEndTimer = time.time()
			
			if babySound >= tmpSound: # If recent sound is higher than previous sound, doubt baby's sound
				up = 1		  
				print "up"
				startTimer = time.time() # Start timer for filtering other sound
				endTimer = 0
				tmpSound = babySound

				while endTimer-startTimer < 5: # Check during 5 seconds
					endTimer = time.time()
				
					length, data = inPCM.read()
					num_data = fromstring(data, dtype = "int16")
					signal = roll(signal, - chunk)
					signal[- chunk :] = num_data
					fftspec = fft(signal)
					babySound = abs(fftspec[200]*signal_scale)
					# Belows check if this sound is curved sound
					if babySound >= 30: 
						max = 1
						print "max"
					elif max == 1 and babySound < tmpSound and babySound < 10:
						down = 1
						print "down"
					tmpSound = babySound
					if up == 1 and max == 1 and down == 1:
						break
	
				if up == 1 and max == 1 and down == 1: # If this sound is curved sound, doubt baby's crying
					count+=1 # Check 5 times
					print count

				up = 0
				max = 0
				down = 0

				startTimer = 0
				endTimer = 0
			print count
			if count >= 5: # If curved sounds appear 5 times higher in 1000Hz. It may be baby's crying
				print "babyCying"
				tcpClientSocket.send ('7')
				tmpSound = 0
				count = 0
				break
		count = 0
		totalStartTimer = 0
		totanEndTimer = 0
	

