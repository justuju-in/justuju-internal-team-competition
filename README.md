# Competitive Programming Team Leaderboard Starter

This starter follows the same idea as the examples:

- Google Apps Script form collects member handles.
- Google Sheets stores members, contest solved counts, and contest links.
- A static `leaderboard.html` page uses the same plain HTML/CSS/JavaScript approach as the reference scoreboard: one embedded `DATA` object, sortable tables, tabs, filtering, team ranks, individual solved counts, rosters, and contest links.
- Justuju branding uses the public logo from `justuju.in` and the website palette: slate, green, soft gray, and orange accent.

## 1. Create The Google Sheet

Create a Google Sheet with these three tabs.

### Members

Headers:

```text
Timestamp,Email,Name,Team,CodeChef,Codeforces,LeetCode,AtCoder,DOMjudge
```

Initial rows can be:

```text
,prateek@example.com,Prateek,Group 1,,,,,
,rajitha@example.com,Rajitha,Group 1,,,,,
,pooja@example.com,Pooja,Group 1,,,,,
,amit@example.com,Amit,Group 2,,,,,
,mahima@example.com,Mahima,Group 2,,,,,
,rani@example.com,Rani,Group 2,,,,,
,anup@example.com,Anup,Group 3,,,,,
,shanti@example.com,Shanti,Group 3,,,,,
,chhotu@example.com,Chhotu,Group 3,,,,,
```

### Contest Scores

Headers:

```text
Date,Contest Code,Contest Name,Contest Link,Name,Team,Problems Solved,Attended,Contest Rank,Updated By,Notes
```

### Profile Stats

This tab is created by the Apps Script. It stores fetched profile data from the submitted handles:

```text
Last Updated,Email,Name,Team,CodeChef Handle,CodeChef Current Rating,CodeChef Highest Rating,CodeChef Stars,CodeChef Contests,CodeChef Total Solved,CodeChef Fully Solved,LeetCode Handle,LeetCode Total Solved,LeetCode Easy,LeetCode Medium,LeetCode Hard,LeetCode Ranking,LeetCode Contest Rating,LeetCode Contests,Codeforces Handle,Codeforces Current Rating,Codeforces Max Rating,Codeforces Rank,Codeforces Max Rank,Codeforces Contribution,Codeforces Friends,AtCoder Handle,AtCoder Current Rating,AtCoder Highest Rating,AtCoder Rank,AtCoder Rated Matches,DOMjudge Username,DOMjudge Contest,DOMjudge Rank,DOMjudge Solved,DOMjudge Total Time,DOMjudge Judged Attempts,DOMjudge Pending
```

DOMjudge stats are loaded from the public DOMjudge Contest API for `judge.csbasics.in`, using contest ID `1` by default. Change `DOMJUDGE_CONTEST_ID` in `apps_script_code.gs` when you want to track a different contest.

Example rows:

```text
2026-07-28,CodeChef,Starters Practice,https://www.codechef.com/,Rajitha,Group 1,30,3 solved
2026-07-28,Typing,Typing Practice,,Amit,Group 2,12,42 WPM
2026-07-28,Flowchart,Week 1,,Anup,Group 3,10,Completed
```

### Contest Links

Headers:

```text
Platform,Contest Code,Title,Date,Link,Notes
```

Example rows:

```text
CodeChef,START249,CodeChef Starters 249,2026-07-29,https://www.codechef.com/START249,Track only contest problems solved
```

## 2. Create The Form

Open the Google Sheet, then go to:

```text
Extensions > Apps Script
```

Paste the code from `apps_script_code.gs`.

Important:

- Change `SPREADSHEET_ID`.
- Deploy as a web app.
- Execute as yourself.
- Access can be "Anyone with the link" or limited to your domain/group.

## 3. Publish CSV Tabs For Leaderboard

If you prefer live Google Sheet reads, publish each tab as CSV:

```text
File > Share > Publish to web > choose tab > CSV
```

Copy the CSV links for:

- Members
- Contest Scores
- Contest Links

The current `leaderboard.html` follows the reference repo style and embeds data directly in the `DATA` object. For live CSV mode, replace the embedded data loader with these URLs:

```js
membersCsvUrl: "PASTE_MEMBERS_CSV_URL_HERE",
contestScoresCsvUrl: "PASTE_CONTEST_SCORES_CSV_URL_HERE",
contestLinksCsvUrl: "PASTE_CONTEST_LINKS_CSV_URL_HERE",
```

## 4. Host The Leaderboard

Upload `leaderboard.html` to GitHub Pages, for example:

```text
your-username.github.io/competitive-leaderboard/leaderboard.html
```

Every time the sheet changes, the leaderboard will update when the page is refreshed.

## Contest Scoring

For CodeChef contests, keep scoring simple:

```text
Individual score = Problems Solved
Team score = Total Problems Solved / Attended Members
Team rank = Highest Team score first
```

After every contest, update `Problems Solved`, `Attended`, and optional `Contest Rank` cells in `Contest Scores`.

- If a member attended and solved 0 problems, set `Attended` to `Yes` and `Problems Solved` to `0`.
- If a member did not attend, set `Attended` to `No`; that member is not counted in the team average.
