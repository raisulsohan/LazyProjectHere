LazyProjectHere for Mac (BETA)
==============================
New After Effects project here + New Premiere Pro project here

বাংলা
-----
সতর্কতা: এটা beta। Mac-এ এখনও কেউ চালিয়ে দেখেনি। সমস্যা হলে GitHub-এ জানান:
https://github.com/raisulsohan/LazyProjectHere/issues

যা করে:
1. Finder-এ একটা ফোল্ডারে (বা তার ভেতরের কোনো ফাইলে) রাইট-ক্লিক করুন।
2. Quick Actions > "New After Effects project here" বা "New Premiere Pro project here" বেছে নিন।
3. ফোল্ডারের নামে project তৈরি হয় (যেমন "My Video.aep" বা "My Video.prproj")।
   ভেতরে তিনটা 30 fps comp/sequence: "My Video_16X9" (1920x1080, খোলা থাকে), "_9X16" (1080x1920), "_4X5" (1080x1350)।
4. Project app-এ খোলে। একই নামের project থাকলে _2, _3 যোগ হয়।

যা লাগবে: macOS, আর /Applications-এ Adobe After Effects ও/অথবা Adobe Premiere Pro (2027)।

ইনস্টল:
1. zip-টা Extract করুন (ডাবল-ক্লিক)।
2. Install.command-এ ডাবল-ক্লিক করুন।
3. macOS "can't be opened" বললে: System Settings > Privacy & Security-এ গিয়ে "Open Anyway" চাপুন। তারপর আবার ডাবল-ক্লিক করুন।
   অথবা Terminal খুলে লিখুন: bash (জায়গা দিয়ে), তারপর Install.command ফাইলটা Terminal-এ টেনে আনুন, Enter চাপুন।
4. প্রথমবার macOS জিজ্ঞাসা করবে টুলটা After Effects নিয়ন্ত্রণ করতে পারবে কি না। OK চাপুন।
Quick Action না দেখালে: System Settings > General > Login Items & Extensions > Finder-এ সেটা চালু করুন।

মনে রাখুন:
- After Effects: আপনার New Project Template থাকলে সেটা ব্যবহার হয়। Template না থাকলে ফোল্ডার: 00 Comps, 01 Footage … 05 Photos।
- Premiere Pro: Import ফোল্ডার বদলায় শুধু Premiere বন্ধ থাকলে।
- After Effects-এর Import ফোল্ডার Mac-এ কাজ করবে কি না এখনও নিশ্চিত নয়।
- Error হলে কারণ লেখা থাকে: ~/Library/Logs/LazyProjectHere.log
- সরাতে: Uninstall.command-এ ডাবল-ক্লিক করুন।

English
-------
WARNING: this is a beta. Nobody has run it on a Mac yet. Please report problems:
https://github.com/raisulsohan/LazyProjectHere/issues

Right-click a folder (or a file in it) in Finder > Quick Actions >
"New After Effects project here" or "New Premiere Pro project here".
It makes "<folder>.aep" / "<folder>.prproj" with three 30 fps comps/sequences
named after the folder (_16X9 1920x1080 open, _9X16 1080x1920, _4X5 1080x1350)
and opens it. Existing projects are never overwritten (_2, _3 ... is added).

Needs macOS and Adobe After Effects and/or Premiere Pro (2027) in /Applications.

Install: extract the zip, double-click Install.command.
If macOS says it "can't be opened": System Settings > Privacy & Security > Open Anyway,
or run it from Terminal: bash /path/to/Install.command
The first time, macOS asks to let it control After Effects: click OK.
No Quick Action? Turn it on in System Settings > General > Login Items & Extensions > Finder.

After Effects uses your New Project Template if you have one. The Premiere Pro
Import folder is set only while Premiere Pro is closed. Whether After Effects'
Import dialog opens in the folder on the Mac is not known yet.
Log: ~/Library/Logs/LazyProjectHere.log   Remove: double-click Uninstall.command.
