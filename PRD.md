This Project is frontend only, everything from backend has to be mocked. 
We need to create a UI screen - live Call console where operator can view Call and all its steps between user and AI. agent.
There will be two parts of the screen. Left part will show nodes joining which shall replicate the agent nodes. 
like fetching user info, getting intent , recommeding slots, asking for deposit, payment confirmation, booking confirmation, human in the loop. All these nodes covers the edge cases, where the call can go. 
It needs to cover error, warning states at each step and its recovery path. 

Right screen will show the live call in an audio player at the bottom and vertical moving interface, where depending on active node, components gets appended. For operator to review or watch what is happening exactly depending on the use case. 

Left side nodes should clearly tell about its state - running, error, warning, success.
And right side should clearly explain that state. 

These split screen UI should be resizable for the split horizontally through drag. 
There should be option to zoom in and zoom out in the left panel. 
We can use https://reactflow.dev/ on canvas for creating left panel.


Then what we can do is 

left side live transcript and right side same, step wise components.

for your questions confidence signal - everytime user says something - agents runs , read what user is saying , gets the confidence signal and based on it the next node is decided. So, that will be shown in the right panel in the user intent gather step. 

fade-> facial correction -> what you said, that should happen. 
Caller context: details, previous visits, recording/privacy indicator. - agreed but  The recording/privacy badge should be persistent in the header, not a node output. - i think belongs to the prev recording and badge should be per audio. 

Call controls should also be shown in the left panel only and the bottom with audio component. 







