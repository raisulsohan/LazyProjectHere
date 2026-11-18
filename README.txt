LazyProjectHere
===============
New After Effects project here + New Premiere Pro project here

বাংলা
-----
যেকোনো ফোল্ডারে রাইট-ক্লিক করে এক ক্লিকে নতুন After Effects বা Premiere Pro project বানায়।
একবার Install.cmd চালালে দুটোই ইনস্টল হয়। যে app PC-তে নেই, তার মেনু যোগ হয় না।

দুটো টুলই যা করে:
1. ফোল্ডারের নামে project ফাইল বানায় (যেমন "My Video" ফোল্ডারে "My Video.aep" বা "My Video.prproj")।
2. তিনটা 30 fps comp/sequence থাকে, নাম ফোল্ডারের নামে:
   "My Video_16X9" (1920x1080, খোলা থাকে), "My Video_9X16" (1080x1920), "My Video_4X5" (1080x1350)।
3. Project app-এ খোলে। Import (Ctrl+I) ওই ফোল্ডারেই খোলে।
4. একই নামের project থাকলে নতুনটার নামের শেষে _2, _3 যোগ হয়। পুরোনো ফাইল কখনো মোছে না।

After Effects:
- Comp: 30 সেকেন্ড, কালো background, square pixel।
- ফোল্ডার: 00 Comps (তিনটা comp এখানে), 01 Footage, 02 Audio, 03 Graphics, 04 Music, 05 Photos।
- New Project Template থাকলে (Edit > Preferences > New Project) টুলটা আপনার template দিয়ে project বানায়।
  Template-এর ফোল্ডারগুলো থাকে। তিনটা comp যায় template-এর comp যে ফোল্ডারে আছে সেখানে।
  Template-এর খালি comp (কোনো layer নেই) মুছে যায়। নতুন তিনটা comp তার জায়গা নেয়।
- After Effects খোলা থাকলেও কাজ করে। Import ফোল্ডারও বদলায়।
  খোলা project-এ save না করা পরিবর্তন থাকলে After Effects আগে "Save changes?" জিজ্ঞাসা করে। Cancel চাপলে কিছুই বদলায় না।
- duration, fps বা রং বদলাতে: AE\AEHere.ps1 খুলে উপরের "Comp settings" অংশ বদলান।

Premiere Pro:
- Bin: 01 Footage, 02 Audio, 03 Graphics, 04 Music, 05 Photos।
- Import ফোল্ডারের অংশটা কাজ করে শুধু Premiere বন্ধ থাকলে। Premiere খোলা থাকলে project খুলবে, কিন্তু Import আগের ফোল্ডারে খুলতে পারে।
- template.prproj বানানো Premiere Pro 2027 (27.0)-এ। এর চেয়ে পুরোনো Premiere থাকলে টুলটা Adobe-এর নিজের template বদলে ব্যবহার করে। তখন Premiere প্রথমবার একটা "_1" কপি save করতে পারে।
- নিজের মতো template চাইলে: Premiere-এ পছন্দমতো একটা খালি project save করুন। ফাইলটা template.prproj নামে Premiere ফোল্ডারে রাখুন।

যা লাগবে: Windows 10/11, আর Adobe After Effects ও/অথবা Adobe Premiere Pro (2027-এ পরীক্ষা করা)।

ইনস্টল:
1. zip ফাইলটা যেকোনো জায়গায় Extract করুন।
2. Install.cmd-এ ডাবল-ক্লিক করুন।
3. কালো উইন্ডোতে "Installed to" দেখালে যেকোনো key চাপুন।
এরপর zip আর Extract করা ফোল্ডার মুছে দিতে পারেন। টুলটা নিজের ফোল্ডারে কপি হয়: %USERPROFILE%\Tools\LazyProjectHere
আগের আলাদা PremiereHere বা AEHere থাকলে Install সেগুলো সরিয়ে দেয়। নিজের template.prproj থাকলে সেটা রেখে দেয়।

ব্যবহার:
1. যেকোনো ফোল্ডারের খালি জায়গায় রাইট-ক্লিক করুন।
2. "New After Effects project here" বা "New Premiere Pro project here" বেছে নিন।
Windows 11-এ অপশনগুলো "Show more options"-এর ভেতরে থাকতে পারে। Shift চেপে রাইট-ক্লিক করলে সরাসরি দেখাবে।

কোনো error হলে কারণ লেখা থাকে:
- %USERPROFILE%\Tools\LazyProjectHere\AE\AEHere.log
- %USERPROFILE%\Tools\LazyProjectHere\Premiere\PremiereHere.log
সরাতে: Uninstall.cmd-এ ডাবল-ক্লিক করুন। দুটো মেনুই সরে যায়। বানানো project-গুলো থেকে যায়।

English
-------
One installer for two right-click entries:
"New After Effects project here" and "New Premiere Pro project here".
An entry is added only if that app is installed.

Both make "<folder name>.aep" / "<folder name>.prproj" with three 30 fps
comps/sequences named after the folder: "<folder>_16X9" 1920x1080 (open),
"<folder>_9X16" 1080x1920 and "<folder>_4X5" 1080x1350. They open the project
and point Import (Ctrl+I) at that folder. Existing projects are never
overwritten (_2, _3 ... is added).

After Effects: 30 s, black, square-pixel comps in "00 Comps" next to 01 Footage,
02 Audio, 03 Graphics, 04 Music and 05 Photos. With a New Project Template
(Preferences > New Project) the project is made from your template: its folders
stay, the comps go into the folder that holds the template's comp, and empty
template comps are replaced. Works with After Effects open or closed.
Comp settings: the "Comp settings" lines at the top of AE\AEHere.ps1.

Premiere Pro: bins 01 Footage ... 05 Photos. The Import folder is set only when
Premiere Pro is closed. Own template: save a blank project as template.prproj
in the Premiere folder.

Install: extract the zip, double-click Install.cmd. (Windows 10/11; tested on 2027.)
It installs to %USERPROFILE%\Tools\LazyProjectHere and removes the old one-app
versions (Tools\PremiereHere, Tools\AEHere), keeping your own template.prproj.
On Windows 11 the entries can be under "Show more options" (or Shift + right-click).
Logs: AE\AEHere.log and Premiere\PremiereHere.log in the install folder.
Remove: double-click Uninstall.cmd.
