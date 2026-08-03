const SPREADSHEET_ID = "1lJTI63vyD5-beXWLTc61jv2-S8OLm28AeIuK4hJlo8o";
const MEMBERS_SHEET = "Members";
const STATS_SHEET = "Profile Stats";
const CONTEST_SCORES_SHEET = "Contest Scores";
const DOMJUDGE_BASE_URL = "https://judge.csbasics.in";
const DOMJUDGE_CONTEST_ID = "1";
const CODECHEF_CONTEST_CODE = "START249";
const CODECHEF_CONTEST_DIVISIONS = ["A", "B", "C", "D", "E"];
const ATCODER_CONTEST_CODE = "abc469";
const ATCODER_CONTEST_NAME = "AtCoder Beginner Contest 469";
const ATCODER_CONTEST_START_SECOND = 1785585600;

const MEMBER_HEADERS = ["Timestamp", "Email", "Name", "Team", "CodeChef", "Codeforces", "LeetCode", "AtCoder", "DOMjudge"];
const CONTEST_SCORE_HEADERS = ["Date", "Contest Code", "Contest Name", "Contest Link", "Name", "Team", "Problems Solved", "Attended", "Contest Rank", "Updated By", "Notes"];
const STATS_HEADERS = [
  "Last Updated",
  "Email",
  "Name",
  "Team",
  "CodeChef Handle",
  "CodeChef Current Rating",
  "CodeChef Highest Rating",
  "CodeChef Stars",
  "CodeChef Contests",
  "CodeChef Total Solved",
  "CodeChef Fully Solved",
  "LeetCode Handle",
  "LeetCode Total Solved",
  "LeetCode Easy",
  "LeetCode Medium",
  "LeetCode Hard",
  "LeetCode Ranking",
  "LeetCode Contest Rating",
  "LeetCode Contests",
  "Codeforces Handle",
  "Codeforces Current Rating",
  "Codeforces Max Rating",
  "Codeforces Rank",
  "Codeforces Max Rank",
  "Codeforces Contribution",
  "Codeforces Friends",
  "AtCoder Handle",
  "AtCoder Current Rating",
  "AtCoder Highest Rating",
  "AtCoder Rank",
  "AtCoder Rated Matches",
  "DOMjudge Username",
  "DOMjudge Contest",
  "DOMjudge Rank",
  "DOMjudge Solved",
  "DOMjudge Total Time",
  "DOMjudge Judged Attempts",
  "DOMjudge Pending"
];

const TEAMS = {
  Prateek: "Group 1",
  Rajitha: "Group 1",
  Pooja: "Group 1",
  Amit: "Group 2",
  Mahima: "Group 2",
  Rani: "Group 2",
  Anup: "Group 3",
  Shanti: "Group 3",
  Chhotu: "Group 3"
};

const PLATFORM_CONFIG = {
  codeChef: {
    label: "CodeChef",
    required: true,
    help: 'Use your existing CodeChef handle. If you do not have one, create a CodeChef account first. <a href="https://www.codechef.com/signup" target="_blank" rel="noopener">Create CodeChef account</a>'
  },
  domjudge: {
    label: "DOMjudge",
    required: true,
    help: "Use your existing DOMjudge username given for practice or contests."
  },
  leetCode: {
    label: "LeetCode",
    required: false,
    help: 'Optional. Use your existing LeetCode username. If you do not have one, create a LeetCode account first. <a href="https://leetcode.com/accounts/signup/" target="_blank" rel="noopener">Create LeetCode account</a>'
  },
  codeforces: {
    label: "Codeforces",
    required: false,
    help: 'Optional. Use your existing Codeforces handle. If you do not have one, create a Codeforces account first. <a href="https://codeforces.com/register" target="_blank" rel="noopener">Create Codeforces account</a>'
  },
  atCoder: {
    label: "AtCoder",
    required: true,
    help: 'Use your existing AtCoder username. If you do not have one, create an AtCoder account first. <a href="https://atcoder.jp/register" target="_blank" rel="noopener">Create AtCoder account</a>'
  }
};

function doGet() {
  return HtmlService.createHtmlOutput(renderForm())
    .setTitle("Competitive Programming Handles")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function submitHandles(payload) {
  const email = clean(payload.email);
  const name = nameFromEmail(email) || clean(payload.name);
  const team = TEAMS[name] || clean(payload.team);

  if (!email || !name) {
    throw new Error("Name and email are required.");
  }

  if (!team) {
    throw new Error("Please select your team.");
  }

  const validation = validateAllHandles(payload);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const row = [
    new Date(),
    email,
    name,
    team,
    validation.handles.codeChef,
    validation.handles.codeforces,
    validation.handles.leetCode,
    validation.handles.atCoder,
    validation.handles.domjudge
  ];

  const sheet = getMembersSheet();
  const values = sheet.getDataRange().getValues();
  const existingRow = values.findIndex((item, index) => index > 0 && String(item[1]).toLowerCase() === email.toLowerCase());

  if (existingRow >= 1) {
    sheet.getRange(existingRow + 1, 1, 1, row.length).setValues([row]);
    updateProfileStats(email, name, team, validation.handles);
    return { updated: true };
  }

  sheet.appendRow(row);
  updateProfileStats(email, name, team, validation.handles);
  return { updated: false };
}

function validateAllHandles(payload) {
  const handles = {
    codeChef: cleanUsername(payload.codeChef),
    domjudge: cleanUsername(payload.domjudge),
    leetCode: cleanUsername(payload.leetCode),
    codeforces: cleanUsername(payload.codeforces),
    atCoder: cleanUsername(payload.atCoder)
  };

  const checks = [
    validateHandle("codeChef", handles.codeChef),
    validateHandle("domjudge", handles.domjudge),
    validateHandle("leetCode", handles.leetCode),
    validateHandle("codeforces", handles.codeforces),
    validateHandle("atCoder", handles.atCoder)
  ];

  const failed = checks.find((check) => !check.valid);
  if (failed) {
    return { valid: false, message: failed.message, handles };
  }

  return { valid: true, message: "", handles };
}

function validateHandle(platformKey, rawUsername) {
  const config = PLATFORM_CONFIG[platformKey];
  const username = cleanUsername(rawUsername);

  if (!username) {
    return config.required
      ? { valid: false, username: "", message: config.label + " username is required." }
      : { valid: true, username: "", message: "Optional" };
  }

  if (!hasPlausibleHandleCharacters(username)) {
    return { valid: false, username, message: "Use only a username or profile URL." };
  }

  if (platformKey === "codeChef") return verifyCodeChef(username);
  if (platformKey === "leetCode") return verifyLeetCode(username);
  if (platformKey === "codeforces") return verifyCodeforces(username);
  if (platformKey === "atCoder") return verifyAtCoder(username);

  // DOMjudge is required but not validated online.
  return { valid: true, username, message: "Saved" };
}

function verifyCodeChef(username) {
  const url = "https://www.codechef.com/users/" + encodeURIComponent(username);
  const result = fetchProfile(url);
  if (result.code === 200 && isCodeChefProfilePage(result.body, username)) {
    return { valid: true, username, message: "Valid" };
  }
  if (result.code === 200) {
    return { valid: false, username, message: "CodeChef profile not found." };
  }
  if (result.code === 0) {
    return { valid: false, username, message: "CodeChef profile not found." };
  }
  return { valid: false, username, message: "CodeChef profile not found." };
}

function isCodeChefProfilePage(body, username) {
  const page = String(body || "");
  const escaped = escapeRegex(username);
  return new RegExp("/users/" + escaped + "\\b", "i").test(page) ||
    new RegExp(">" + escaped + "<", "i").test(page) ||
    new RegExp('"' + escaped + '"', "i").test(page);
}

function verifyCodeforces(username) {
  const url = "https://codeforces.com/api/user.info?handles=" + encodeURIComponent(username);
  const result = fetchJson(url);
  if (result.ok && result.json && result.json.status === "OK") {
    return { valid: true, username, message: "Valid" };
  }

  const profileResult = verifyCodeforcesProfilePage(username);
  if (profileResult.valid) {
    return profileResult;
  }

  if (result.json && result.json.status === "FAILED" && profileResult.notFound) {
    return { valid: false, username, message: "Codeforces profile not found." };
  }
  if (!result.ok && profileResult.notFound) {
    return { valid: false, username, message: "Codeforces profile not found." };
  }
  return { valid: false, username, message: "Codeforces profile not found." };
}

function verifyCodeforcesProfilePage(username) {
  const url = "https://codeforces.com/profile/" + encodeURIComponent(username);
  const result = fetchProfile(url);
  if (result.code === 200 && isCodeforcesProfilePage(result.body, username)) {
    return { valid: true, username, message: "Valid" };
  }
  return { valid: false, username, message: "Codeforces profile not found.", notFound: isCodeforcesNotFoundPage(result.body) };
}

function isCodeforcesProfilePage(body, username) {
  const page = String(body || "");
  const escaped = escapeRegex(username);
  return new RegExp("/profile/" + escaped + "\\b", "i").test(page) ||
    new RegExp(">" + escaped + "<", "i").test(page);
}

function isCodeforcesNotFoundPage(body) {
  return /user with handle .* not found|handle .* not found|not found/i.test(String(body || ""));
}

function verifyLeetCode(username) {
  const query = "query userProfile($username: String!) { matchedUser(username: $username) { username } }";
  const result = fetchJsonPost("https://leetcode.com/graphql", {
    query,
    variables: { username }
  }, {
    "Content-Type": "application/json",
    "Referer": "https://leetcode.com/" + encodeURIComponent(username) + "/"
  });

  if (result.ok && result.json && result.json.data && result.json.data.matchedUser) {
    return { valid: true, username, message: "Valid" };
  }
  if (result.ok && result.json && result.json.data && result.json.data.matchedUser === null) {
    return { valid: false, username, message: "LeetCode profile not found." };
  }
  if (!result.ok) {
    return { valid: false, username, message: "LeetCode profile not found." };
  }
  return { valid: false, username, message: "LeetCode profile not found." };
}

function verifyAtCoder(username) {
  const url = "https://atcoder.jp/users/" + encodeURIComponent(username);
  const result = fetchProfile(url);
  if (result.code === 200 && isAtCoderProfilePage(result.body, username)) {
    return { valid: true, username, message: "Valid" };
  }
  if (result.code === 200) {
    return { valid: false, username, message: "AtCoder profile not found." };
  }
  if (result.code === 0) {
    return { valid: false, username, message: "AtCoder profile not found." };
  }
  if (result.code === 403 || result.code === 429) {
    return { valid: false, username, message: "Could not verify AtCoder profile. Try again later." };
  }
  return { valid: false, username, message: "AtCoder profile not found." };
}

function isAtCoderProfilePage(body, username) {
  const page = String(body || "");
  const escaped = escapeRegex(username);
  return new RegExp("/users/" + escaped + "\\b", "i").test(page) ||
    new RegExp("<title>" + escaped + " - AtCoder</title>", "i").test(page);
}

function authorizeExternalRequests() {
  const codeChef = fetchProfile("https://www.codechef.com/users/gummarajitha12");
  const codeforces = fetchJson("https://codeforces.com/api/user.info?handles=rajithagumma22");
  const leetCode = fetchJsonPost("https://leetcode.com/graphql", {
      query: "query userProfile($username: String!) { matchedUser(username: $username) { username } }",
      variables: { username: "rajithagumma22" }
    }, {
      "Content-Type": "application/json",
      "Referer": "https://leetcode.com/rajithagumma22/"
    });
  const atCoder = fetchProfile("https://atcoder.jp/users/rajithagumma22");

  const results = {
    codeChef: {
      ok: codeChef.ok,
      code: codeChef.code,
      profileDetected: isCodeChefProfilePage(codeChef.body, "gummarajitha12")
    },
    codeforces: {
      ok: codeforces.ok,
      code: codeforces.code,
      status: codeforces.json && codeforces.json.status
    },
    leetCode: {
      ok: leetCode.ok,
      code: leetCode.code,
      matchedUser: !!(leetCode.json && leetCode.json.data && leetCode.json.data.matchedUser)
    },
    atCoder: {
      ok: atCoder.ok,
      code: atCoder.code,
      containsUsername: /rajithagumma22/i.test(atCoder.body || "")
    }
  };
  Logger.log(JSON.stringify(results));
  return results;
}

function updateProfileStats(email, name, team, handles) {
  const stats = collectProfileStats(handles);
  const row = [
    new Date(),
    email,
    name,
    team,
    handles.codeChef,
    stats.codeChef.currentRating,
    stats.codeChef.highestRating,
    stats.codeChef.stars,
    stats.codeChef.contests,
    stats.codeChef.totalSolved,
    stats.codeChef.fullySolved,
    handles.leetCode,
    stats.leetCode.totalSolved,
    stats.leetCode.easySolved,
    stats.leetCode.mediumSolved,
    stats.leetCode.hardSolved,
    stats.leetCode.ranking,
    stats.leetCode.contestRating,
    stats.leetCode.contests,
    handles.codeforces,
    stats.codeforces.currentRating,
    stats.codeforces.maxRating,
    stats.codeforces.rank,
    stats.codeforces.maxRank,
    stats.codeforces.contribution,
    stats.codeforces.friends,
    handles.atCoder,
    stats.atCoder.currentRating,
    stats.atCoder.highestRating,
    stats.atCoder.rank,
    stats.atCoder.ratedMatches,
    handles.domjudge,
    stats.domjudge.contest,
    stats.domjudge.rank,
    stats.domjudge.solved,
    stats.domjudge.totalTime,
    stats.domjudge.judgedAttempts,
    stats.domjudge.pending
  ];

  const sheet = getStatsSheet();
  const values = sheet.getDataRange().getValues();
  const existingRow = values.findIndex((item, index) => index > 0 && String(item[1]).toLowerCase() === String(email).toLowerCase());

  if (existingRow >= 1) {
    sheet.getRange(existingRow + 1, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function refreshAllProfileStats() {
  const sheet = getMembersSheet();
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { refreshed: 0 };

  resetStatsSheet();

  const headers = rows[0].map(String);
  let refreshed = 0;

  rows.slice(1).forEach((row) => {
    const email = valueByHeader(headers, row, "Email");
    const name = valueByHeader(headers, row, "Name");
    if (!email || !name) return;

    updateProfileStats(email, name, valueByHeader(headers, row, "Team"), {
      codeChef: valueByHeader(headers, row, "CodeChef"),
      codeforces: valueByHeader(headers, row, "Codeforces"),
      leetCode: valueByHeader(headers, row, "LeetCode"),
      atCoder: valueByHeader(headers, row, "AtCoder"),
      domjudge: valueByHeader(headers, row, "DOMjudge")
    });
    refreshed += 1;
  });

  return { refreshed };
}

function refreshCodeChefContestScores(contestCode) {
  const code = clean(contestCode) || CODECHEF_CONTEST_CODE;
  const members = getMembersForContestScores();
  const membersByHandle = {};

  members.forEach((member) => {
    if (member.codeChef) {
      membersByHandle[normalizeCodeChefHandle(member.codeChef)] = member;
    }
  });

  const wantedHandles = Object.keys(membersByHandle);
  if (!wantedHandles.length) {
    throw new Error("No CodeChef handles found in Members sheet.");
  }

  const foundByHandle = {};
  const divisions = CODECHEF_CONTEST_DIVISIONS.map((suffix) => code + suffix);

  divisions.forEach((divisionCode) => {
    if (Object.keys(foundByHandle).length === wantedHandles.length) return;
    const divisionResult = fetchCodeChefRankingDivision(divisionCode, wantedHandles, foundByHandle);
    Object.keys(divisionResult.results).forEach((handle) => {
      foundByHandle[handle] = divisionResult.results[handle];
    });
  });

  const rows = members.map((member) => {
    const handleKey = normalizeCodeChefHandle(member.codeChef);
    const result = foundByHandle[handleKey];
    const contestName = "CodeChef Starters " + code.replace(/^START/i, "");
    const contestLink = "https://www.codechef.com/" + code;
    const attended = !!result;
    const notes = result
      ? "Auto fetched from " + result.contestCode
      : "Not found in CodeChef ranklist";

    return [
      new Date(),
      code,
      contestName,
      contestLink,
      member.name,
      member.team,
      result ? result.solved : 0,
      attended ? "Yes" : "No",
      result ? result.rank : "",
      "Auto",
      notes
    ];
  });

  upsertContestScoreRows(code, rows);
  const summary = rows.reduce((acc, row) => {
    acc[row[4]] = { contestCode: row[1], solved: row[6], attended: row[7], rank: row[8], notes: row[10] };
    return acc;
  }, {});
  Logger.log(JSON.stringify(summary));
  return summary;
}

function refreshSTART249ContestScores() {
  return refreshCodeChefContestScores("START249");
}

function refreshAtCoderContestScores(contestCode, contestName, fromSecond) {
  const code = clean(contestCode) || ATCODER_CONTEST_CODE;
  const name = clean(contestName) || ATCODER_CONTEST_NAME;
  const since = Number(fromSecond) || ATCODER_CONTEST_START_SECOND;
  const members = getMembersForAtCoderContestScores();

  if (!members.length) {
    throw new Error("No AtCoder handles found in Members sheet.");
  }

  const rows = members.map((member) => {
    const result = fetchAtCoderContestResult(member.atCoder, code, since);
    const attended = result.submissions > 0;
    const notes = attended
      ? "Auto fetched from AtCoder Problems API"
      : "No submissions found for this contest";

    return [
      new Date(),
      code.toUpperCase(),
      name,
      "https://atcoder.jp/contests/" + code,
      member.name,
      member.team,
      result.solved,
      attended ? "Yes" : "No",
      "",
      "Auto",
      notes
    ];
  });

  upsertContestScoreRows(code.toUpperCase(), rows);
  const summary = rows.reduce((acc, row) => {
    acc[row[4]] = { contestCode: row[1], solved: row[6], attended: row[7], notes: row[10] };
    return acc;
  }, {});
  Logger.log(JSON.stringify(summary));
  return summary;
}

function refreshABC469ContestScores() {
  return refreshAtCoderContestScores("abc469", "AtCoder Beginner Contest 469", 1785585600);
}

function getMembersForContestScores() {
  const sheet = getMembersSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(String);
  return values.slice(1).map((row) => ({
    email: valueByHeader(headers, row, "Email"),
    name: valueByHeader(headers, row, "Name"),
    team: valueByHeader(headers, row, "Team"),
    codeChef: valueByHeader(headers, row, "CodeChef")
  })).filter((member) => member.name && member.team);
}

function getMembersForAtCoderContestScores() {
  const sheet = getMembersSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(String);
  return values.slice(1).map((row) => ({
    email: valueByHeader(headers, row, "Email"),
    name: valueByHeader(headers, row, "Name"),
    team: valueByHeader(headers, row, "Team"),
    atCoder: valueByHeader(headers, row, "AtCoder")
  })).filter((member) => member.name && member.team && member.atCoder);
}

function fetchAtCoderContestResult(username, contestCode, fromSecond) {
  const url = "https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=" +
    encodeURIComponent(username) + "&from_second=" + encodeURIComponent(fromSecond);
  const result = fetchJson(url);

  if (!result.ok || !Array.isArray(result.json)) {
    return { solved: 0, submissions: 0 };
  }

  const contestSubmissions = result.json.filter((submission) => {
    return String(submission.contest_id || "").toLowerCase() === String(contestCode || "").toLowerCase();
  });
  const solvedProblems = {};

  contestSubmissions.forEach((submission) => {
    if (submission.result === "AC") {
      solvedProblems[submission.problem_id] = true;
    }
  });

  return {
    solved: Object.keys(solvedProblems).length,
    submissions: contestSubmissions.length
  };
}

function fetchCodeChefRankingDivision(contestCode, wantedHandles, alreadyFound) {
  const session = openCodeChefRankingSession(contestCode);
  if (!session.ok) {
    return { contestCode, results: {}, error: session.error || "Could not open ranklist" };
  }

  const results = {};
  let page = 1;
  let availablePages = 1;

  while (page <= availablePages) {
    const url = "https://www.codechef.com/api/rankings/" + encodeURIComponent(contestCode) +
      "?itemsPerPage=100&order=asc&page=" + page + "&sortBy=rank";
    const response = fetchCodeChefRankingApi(url, contestCode, session);
    if (!response.ok || !response.json) break;

    availablePages = Number(response.json.availablePages) || 0;
    const list = Array.isArray(response.json.list) ? response.json.list : [];
    const contestName = response.json.contest_name || contestCode;

    list.forEach((rankRow) => {
      const handle = normalizeCodeChefHandle(rankRow.user_handle);
      if (!handle || wantedHandles.indexOf(handle) === -1 || alreadyFound[handle] || results[handle]) return;
      results[handle] = {
        contestCode,
        contestName,
        rank: rankRow.rank || "",
        solved: countSolvedCodeChefProblems(rankRow.problems_status)
      };
    });

    if (wantedHandles.every((handle) => alreadyFound[handle] || results[handle])) break;
    if (!list.length) break;
    page += 1;
  }

  return { contestCode, results };
}

function openCodeChefRankingSession(contestCode) {
  const url = "https://www.codechef.com/rankings/" + encodeURIComponent(contestCode);
  try {
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        "User-Agent": "Mozilla/5.0 Apps Script CodeChef ranklist fetcher",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    const body = response.getContentText();
    const csrfToken = firstMatch(body, /csrfToken["']?\s*[:=]\s*["']([a-f0-9]{64})["']/i) ||
      firstMatch(body, /["']([a-f0-9]{64})["']/i);
    const cookie = cookieHeaderFromResponse(response);

    if (!csrfToken || !cookie) {
      return { ok: false, error: "Could not read CodeChef CSRF token or cookie." };
    }

    return { ok: true, csrfToken, cookie };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

function fetchCodeChefRankingApi(url, contestCode, session) {
  try {
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        "User-Agent": "Mozilla/5.0 Apps Script CodeChef ranklist fetcher",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.codechef.com/rankings/" + encodeURIComponent(contestCode) + "?itemsPerPage=100&order=asc&page=1&sortBy=rank",
        "X-Requested-With": "XMLHttpRequest",
        "x-csrf-token": session.csrfToken,
        "Cookie": session.cookie
      }
    });
    const code = response.getResponseCode();
    const body = response.getContentText();
    if (code < 200 || code >= 300) {
      return { ok: false, code, json: null, error: body };
    }
    const json = JSON.parse(body);
    if (json.status === "apierror") {
      return { ok: false, code, json, error: json.message || "CodeChef API error" };
    }
    return { ok: true, code, json };
  } catch (error) {
    return { ok: false, code: 0, json: null, error: String(error) };
  }
}

function countSolvedCodeChefProblems(problemsStatus) {
  if (!problemsStatus || typeof problemsStatus !== "object") return 0;
  return Object.keys(problemsStatus).reduce((total, problemCode) => {
    const item = problemsStatus[problemCode] || {};
    const score = Number(item.score) || 0;
    return total + (score > 0 ? 1 : 0);
  }, 0);
}

function upsertContestScoreRows(baseContestCode, rows) {
  const sheet = getContestScoresSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const contestCodeIndex = headers.indexOf("Contest Code");
  const nameIndex = headers.indexOf("Name");
  const existingRows = {};

  values.slice(1).forEach((row, index) => {
    const rowContestCode = clean(row[contestCodeIndex]);
    const rowName = clean(row[nameIndex]).toLowerCase();
    if (rowName && (rowContestCode === baseContestCode || rowContestCode.indexOf(baseContestCode) === 0)) {
      existingRows[rowName] = index + 2;
    }
  });

  rows.forEach((row) => {
    const key = clean(row[4]).toLowerCase();
    const rowNumber = existingRows[key];
    if (rowNumber) {
      sheet.getRange(rowNumber, 1, 1, CONTEST_SCORE_HEADERS.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
  });
}

function resetStatsSheet() {
  const sheet = getStatsSheet();
  sheet.clearContents();
  ensureColumnCapacity(sheet, STATS_HEADERS.length);
  sheet.getRange(1, 1, 1, STATS_HEADERS.length).setValues([STATS_HEADERS]);
  sheet.setFrozenRows(1);
}

function valueByHeader(headers, row, header) {
  const index = headers.indexOf(header);
  return index === -1 ? "" : clean(row[index]);
}

function collectProfileStats(handles) {
  return {
    codeChef: handles.codeChef ? fetchCodeChefStats(handles.codeChef) : blankCodeChefStats(),
    leetCode: handles.leetCode ? fetchLeetCodeStats(handles.leetCode) : blankLeetCodeStats(),
    codeforces: handles.codeforces ? fetchCodeforcesStats(handles.codeforces) : blankCodeforcesStats(),
    atCoder: handles.atCoder ? fetchAtCoderStats(handles.atCoder) : blankAtCoderStats(),
    domjudge: handles.domjudge ? fetchDomjudgeStats(handles.domjudge) : blankDomjudgeStats()
  };
}

function fetchCodeChefStats(username) {
  const result = fetchProfile("https://www.codechef.com/users/" + encodeURIComponent(username));
  if (!result.ok) return blankCodeChefStats();

  const body = result.body || "";
  const ratings = extractAllMatches(body, /"rating":"?(\d+)"?/g).map(Number).filter(Boolean);
  const currentRating = ratings.length ? ratings[ratings.length - 1] : firstMatch(body, /rating-number[^>]*>\s*(\d+)/i);
  const highestRating = ratings.length ? Math.max.apply(null, ratings) : firstMatch(body, /Highest Rating[^0-9]*(\d+)/i);
  const totalSolved = firstMatch(body, /Total Problems Solved:\s*([0-9,]+)/i);
  const stars = firstMatch(stripHtml(body), /(\d+)\s*star/i) || firstMatch(body, /rating-star[^>]*>\s*([^<]+)/i);
  const fullySolved = firstMatch(body, /Fully Solved[^0-9]*([0-9,]+)/i) || totalSolved;

  return {
    currentRating: currentRating || "",
    highestRating: highestRating || "",
    stars: stars || "",
    contests: ratings.length || "",
    totalSolved: totalSolved || "",
    fullySolved: fullySolved || ""
  };
}

function fetchLeetCodeStats(username) {
  const result = fetchJsonPost("https://leetcode.com/graphql", {
    query: [
      "query userProfile($username: String!) {",
      "  matchedUser(username: $username) {",
      "    username",
      "    profile { ranking }",
      "    submitStats { acSubmissionNum { difficulty count submissions } }",
      "  }",
      "  userContestRanking(username: $username) { attendedContestsCount rating globalRanking topPercentage }",
      "}"
    ].join("\n"),
    variables: { username }
  }, {
    "Content-Type": "application/json",
    "Referer": "https://leetcode.com/" + encodeURIComponent(username) + "/"
  });

  if (!result.ok || !result.json || !result.json.data || !result.json.data.matchedUser) {
    return blankLeetCodeStats();
  }

  const data = result.json.data;
  const solved = {};
  (data.matchedUser.submitStats.acSubmissionNum || []).forEach((item) => {
    solved[item.difficulty] = item.count;
  });

  return {
    totalSolved: solved.All || "",
    easySolved: solved.Easy || "",
    mediumSolved: solved.Medium || "",
    hardSolved: solved.Hard || "",
    ranking: data.matchedUser.profile ? data.matchedUser.profile.ranking || "" : "",
    contestRating: data.userContestRanking && data.userContestRanking.rating ? Math.round(data.userContestRanking.rating) : "",
    contests: data.userContestRanking ? data.userContestRanking.attendedContestsCount || "" : ""
  };
}

function fetchCodeforcesStats(username) {
  const result = fetchJson("https://codeforces.com/api/user.info?handles=" + encodeURIComponent(username));
  if (!result.ok || !result.json || result.json.status !== "OK" || !result.json.result || !result.json.result.length) {
    return blankCodeforcesStats();
  }

  const user = result.json.result[0];
  return {
    currentRating: user.rating || "",
    maxRating: user.maxRating || "",
    rank: user.rank || "",
    maxRank: user.maxRank || "",
    contribution: user.contribution || "",
    friends: user.friendOfCount || ""
  };
}

function fetchAtCoderStats(username) {
  const result = fetchProfile("https://atcoder.jp/users/" + encodeURIComponent(username));
  if (!result.ok) return blankAtCoderStats();

  const text = stripHtml(result.body || "");
  return {
    currentRating: firstMatch(text, /Rating\s+(\d+)/i) || "",
    highestRating: firstMatch(text, /Highest Rating\s+(\d+)/i) || "",
    rank: normalizeNumber(firstMatch(text, /Rank\s+([0-9,]+)(?:st|nd|rd|th)?/i)) || "",
    ratedMatches: firstMatch(text, /Rated Matches\s+(\d+)/i) || ""
  };
}

function fetchDomjudgeStats(username) {
  const contestResult = fetchJson(DOMJUDGE_BASE_URL + "/api/contests/" + encodeURIComponent(DOMJUDGE_CONTEST_ID));
  const teamsResult = fetchJson(DOMJUDGE_BASE_URL + "/api/contests/" + encodeURIComponent(DOMJUDGE_CONTEST_ID) + "/teams");
  const scoreboardResult = fetchJson(DOMJUDGE_BASE_URL + "/api/contests/" + encodeURIComponent(DOMJUDGE_CONTEST_ID) + "/scoreboard");

  if (!teamsResult.ok || !scoreboardResult.ok || !Array.isArray(teamsResult.json)) {
    return blankDomjudgeStats();
  }

  const wanted = normalizeHandleKey(username);
  const team = teamsResult.json.find((item) => {
    return normalizeHandleKey(item.name) === wanted ||
      normalizeHandleKey(item.display_name) === wanted ||
      normalizeHandleKey(item.icpc_id) === wanted;
  });

  if (!team || !scoreboardResult.json || !Array.isArray(scoreboardResult.json.rows)) {
    return blankDomjudgeStats();
  }

  const scoreboardRow = scoreboardResult.json.rows.find((item) => String(item.team_id) === String(team.id));
  if (!scoreboardRow) return blankDomjudgeStats();

  const problems = Array.isArray(scoreboardRow.problems) ? scoreboardRow.problems : [];
  const judgedAttempts = problems.reduce((total, item) => total + (Number(item.num_judged) || 0), 0);
  const pending = problems.reduce((total, item) => total + (Number(item.num_pending) || 0), 0);
  const score = scoreboardRow.score || {};
  const contest = contestResult.ok && contestResult.json ? contestResult.json.name || contestResult.json.formal_name || "" : "";

  return {
    contest,
    rank: scoreboardRow.rank || "",
    solved: score.num_solved || "",
    totalTime: score.total_time || "",
    judgedAttempts,
    pending
  };
}

function blankCodeChefStats() {
  return { currentRating: "", highestRating: "", stars: "", contests: "", totalSolved: "", fullySolved: "" };
}

function blankLeetCodeStats() {
  return { totalSolved: "", easySolved: "", mediumSolved: "", hardSolved: "", ranking: "", contestRating: "", contests: "" };
}

function blankCodeforcesStats() {
  return { currentRating: "", maxRating: "", rank: "", maxRank: "", contribution: "", friends: "" };
}

function blankAtCoderStats() {
  return { currentRating: "", highestRating: "", rank: "", ratedMatches: "" };
}

function blankDomjudgeStats() {
  return { contest: "", rank: "", solved: "", totalTime: "", judgedAttempts: "", pending: "" };
}

function fetchProfile(url, followRedirects) {
  try {
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: followRedirects !== false,
      headers: { "User-Agent": "Mozilla/5.0 Apps Script handle checker" }
    });
    const code = response.getResponseCode();
    return { ok: code >= 200 && code < 300, code, body: response.getContentText() };
  } catch (error) {
    return { ok: false, code: 0, body: String(error) };
  }
}

function fetchJson(url) {
  const result = fetchProfile(url);
  if (!result.ok) return { ok: false, code: result.code, json: null, error: result.body };
  try {
    return { ok: true, code: result.code, json: JSON.parse(result.body) };
  } catch (error) {
    return { ok: false, code: result.code, json: null, error: String(error) };
  }
}

function fetchJsonPost(url, payload, headers) {
  try {
    const response = UrlFetchApp.fetch(url, {
      method: "post",
      muteHttpExceptions: true,
      followRedirects: true,
      contentType: "application/json",
      payload: JSON.stringify(payload),
      headers: headers || {}
    });
    const code = response.getResponseCode();
    return {
      ok: code >= 200 && code < 300,
      code,
      json: JSON.parse(response.getContentText())
    };
  } catch (error) {
    return { ok: false, code: 0, json: null, error: String(error) };
  }
}

function getMembersSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(MEMBERS_SHEET);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(MEMBERS_SHEET);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Email", "Name", "Team", "CodeChef", "Codeforces", "LeetCode", "AtCoder", "DOMjudge"]);
  } else {
    ensureLeetCodeColumn(sheet);
  }

  return sheet;
}

function getStatsSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(STATS_SHEET);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(STATS_SHEET);
  }

  ensureColumnCapacity(sheet, STATS_HEADERS.length);
  ensureHeaders(sheet, STATS_HEADERS);
  return sheet;
}

function getContestScoresSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONTEST_SCORES_SHEET);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONTEST_SCORES_SHEET);
  }

  ensureColumnCapacity(sheet, CONTEST_SCORE_HEADERS.length);
  ensureHeaders(sheet, CONTEST_SCORE_HEADERS);
  return sheet;
}

function ensureHeaders(sheet, headers) {
  ensureColumnCapacity(sheet, headers.length);
  sheet.getRange(1, 1, 1, sheet.getMaxColumns()).clearContent();
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0].map(String);
  const needsHeader = current.some((value, index) => value !== headers[index]);
  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function ensureColumnCapacity(sheet, requiredColumns) {
  const missingColumns = requiredColumns - sheet.getMaxColumns();
  if (missingColumns > 0) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), missingColumns);
  }
}

function ensureLeetCodeColumn(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  if (headers.indexOf("LeetCode") !== -1) return;

  const codeforcesIndex = headers.indexOf("Codeforces");
  const insertAfter = codeforcesIndex === -1 ? sheet.getLastColumn() : codeforcesIndex + 1;
  sheet.insertColumnAfter(insertAfter);
  sheet.getRange(1, insertAfter + 1).setValue("LeetCode");
}

function clean(value) {
  return String(value || "").trim();
}

function nameFromEmail(email) {
  const localPart = clean(email).split("@")[0].toLowerCase();
  return Object.keys(TEAMS).find((name) => name.toLowerCase() === localPart) || "";
}

function cleanUsername(value) {
  const raw = clean(value);
  const urlMatch = raw.match(/\/(?:users|profile)\/([^/?#]+)/i);
  if (urlMatch) return decodeURIComponent(urlMatch[1]).trim();
  const leetCodeMatch = raw.match(/leetcode\.com\/([^/?#]+)/i);
  if (leetCodeMatch && !/^problemset|contest|discuss|accounts$/i.test(leetCodeMatch[1])) {
    return decodeURIComponent(leetCodeMatch[1]).trim();
  }
  return raw.replace(/^@+/, "");
}

function hasPlausibleHandleCharacters(username) {
  return /^[A-Za-z0-9_.-]+$/.test(username);
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstMatch(value, regex) {
  const match = String(value || "").match(regex);
  return match ? clean(match[1]) : "";
}

function extractAllMatches(value, regex) {
  const matches = [];
  let match;
  while ((match = regex.exec(String(value || ""))) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeNumber(value) {
  return String(value || "").replace(/,/g, "").trim();
}

function normalizeHandleKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeCodeChefHandle(value) {
  return cleanUsername(value).toLowerCase();
}

function cookieHeaderFromResponse(response) {
  const headers = response.getAllHeaders();
  const setCookie = headers["Set-Cookie"] || headers["set-cookie"] || [];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  return cookies
    .map((cookie) => String(cookie || "").split(";")[0])
    .filter(Boolean)
    .join("; ");
}

function renderForm() {
  const nameOptions = Object.keys(TEAMS)
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <base target="_top">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Competitive Programming Handles</title>
  <style>
    :root {
      --bg: #f6f6f2;
      --panel: #ffffff;
      --ink: #1f2a2f;
      --muted: #5b6a72;
      --line: #d9dfd5;
      --slate-deep: #2b3540;
      --green: #405b48;
      --green-deep: #243a2e;
      --accent: #ee965f;
      --ok: #087443;
      --bad: #b42318;
      --wait: #855a00;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        linear-gradient(rgba(31, 42, 47, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(31, 42, 47, 0.035) 1px, transparent 1px),
        var(--bg);
      background-size: 24px 24px;
      color: var(--ink);
      font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
      line-height: 1.35;
    }
    main {
      width: min(860px, calc(100vw - 28px));
      margin: 32px auto;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 0;
      overflow: hidden;
    }
    .brand-bar {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 24px;
      background: var(--slate-deep);
      color: #fff;
    }
    .brand-bar img {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #fff;
    }
    .brand-bar span {
      color: var(--accent);
      font-size: 1.25rem;
      font-weight: 800;
    }
    .content { padding: 24px; }
    h1 { margin: 0 0 10px; font-size: 1.7rem; line-height: 1.15; letter-spacing: 0; }
    p { margin: 0 0 20px; color: var(--muted); }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    label {
      display: grid;
      gap: 6px;
      font-weight: 700;
      color: var(--ink);
    }
    .team-preview {
      display: grid;
      gap: 6px;
      min-height: 42px;
      align-content: end;
    }
    .team-preview span {
      font-weight: 700;
      color: var(--ink);
    }
    .team-preview strong {
      min-height: 42px;
      display: flex;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 9px 10px;
      background: #f5f7f8;
      color: var(--muted);
      font: inherit;
    }
    input, select {
      width: 100%;
      min-height: 42px;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 9px 10px;
      font: inherit;
      background: #fff;
      color: var(--ink);
    }
    input:focus, select:focus {
      outline: 2px solid rgba(238, 150, 95, 0.24);
      border-color: var(--accent);
    }
    .wide { grid-column: 1 / -1; }
    .handle-row {
      display: grid;
      grid-template-columns: 150px minmax(0, 1fr) 120px;
      gap: 10px;
      align-items: start;
      padding: 12px 0;
      border-top: 1px solid var(--line);
    }
    .handle-row label { padding-top: 9px; }
    .help {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 0.88rem;
    }
    .help a { color: var(--green-deep); font-weight: 800; }
    .status {
      min-height: 42px;
      display: flex;
      align-items: center;
      font-size: 0.92rem;
      font-weight: 800;
    }
    .idle { color: var(--muted); }
    .valid { color: var(--ok); }
    .invalid { color: var(--bad); }
    .checking { color: var(--wait); }
    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 18px;
      flex-wrap: wrap;
    }
    button {
      min-height: 42px;
      border: 0;
      border-radius: 6px;
      padding: 0 18px;
      background: var(--green);
      color: #fff;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }
    button:hover { background: var(--green-deep); }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    #message { color: var(--muted); font-weight: 700; }
    #message.error { color: var(--bad); }
    @media (max-width: 700px) {
      main { margin: 10px auto; }
      .brand-bar, .content { padding: 16px; }
      .grid { grid-template-columns: 1fr; }
      .handle-row { grid-template-columns: 1fr; }
      .handle-row label { padding-top: 0; }
      .status { min-height: 24px; }
    }
  </style>
</head>
<body>
  <main>
    <div class="brand-bar">
      <img src="https://www.justuju.in/assets/current-site/asset-21.png" alt="Justuju logo">
      <span>Justuju</span>
    </div>
    <div class="content">
    <h1>Competitive Programming Handles</h1>
    <p>CodeChef, AtCoder, and DOMjudge usernames are required. Codeforces and LeetCode are optional; share them if you already have them.</p>

    <form id="form">
      <section class="grid">
        <label>
          Name
          <select name="name" required>
            <option value="">Select your name</option>
            ${nameOptions}
          </select>
        </label>

        <div class="team-preview">
          <span>Team</span>
          <strong id="teamPreview">Select your name</strong>
        </div>

        <label class="wide">
          Email
          <input name="email" type="email" autocomplete="email" required>
        </label>
      </section>

      ${renderHandleRow("codeChef", "CodeChef username or profile URL")}
      ${renderHandleRow("domjudge", "DOMjudge username")}
      ${renderHandleRow("leetCode", "LeetCode username or profile URL")}
      ${renderHandleRow("codeforces", "Codeforces handle or profile URL")}
      ${renderHandleRow("atCoder", "AtCoder username or profile URL")}

      <div class="actions">
        <button id="submit" type="submit" disabled>Submit</button>
        <span id="message" role="status" aria-live="polite"></span>
      </div>
    </form>
    </div>
  </main>

  <script>
    const platformConfig = ${JSON.stringify(PLATFORM_CONFIG)};
    const state = {};
    const form = document.getElementById("form");
    const button = document.getElementById("submit");
    const message = document.getElementById("message");

    Object.keys(platformConfig).forEach((platform) => {
      const input = form.elements[platform];
      state[platform] = {
        valid: !platformConfig[platform].required,
        checking: false,
        username: ""
      };
      input.addEventListener("input", debounce(() => validateOne(platform), 650));
      input.addEventListener("blur", () => validateOne(platform));
    });

    form.elements.name.addEventListener("change", () => {
      const team = ${JSON.stringify(TEAMS)}[form.elements.name.value] || "Select your name";
      document.getElementById("teamPreview").textContent = team;
      updateSubmitState();
    });

    ["name", "email"].forEach((name) => {
      form.elements[name].addEventListener("input", updateSubmitState);
      form.elements[name].addEventListener("change", updateSubmitState);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      button.disabled = true;
      message.className = "";
      message.textContent = "Submitting...";

      Promise.all(Object.keys(platformConfig).map(validateOne)).then(() => {
        updateSubmitState();
        if (button.disabled) {
          message.className = "error";
          message.textContent = "Please fix the required usernames before submitting.";
          return;
        }

        button.disabled = true;
        const payload = Object.fromEntries(new FormData(form).entries());

        google.script.run
          .withSuccessHandler((result) => {
            message.className = "";
            message.textContent = result.updated ? "Updated successfully." : "Submitted successfully.";
            button.disabled = false;
          })
          .withFailureHandler((error) => {
            message.className = "error";
            message.textContent = error.message || "Submission failed.";
            button.disabled = false;
          })
          .submitHandles(payload);
      });
    });

    function validateOne(platform) {
      const input = form.elements[platform];
      const username = input.value.trim();
      const config = platformConfig[platform];

      if (!username) {
        state[platform] = { valid: !config.required, checking: false, username: "" };
        setStatus(platform, "idle", config.required ? "Required" : "Optional");
        updateSubmitState();
        return Promise.resolve(state[platform]);
      }

      state[platform].checking = true;
      setStatus(platform, "checking", "Checking...");
      updateSubmitState();

      return new Promise((resolve) => {
        google.script.run
          .withSuccessHandler((result) => {
            state[platform] = {
              valid: !!result.valid,
              checking: false,
              username: result.username || username
            };
            if (result.valid) {
              input.value = result.username || username;
              setStatus(platform, "valid", result.message || (platform === "domjudge" ? "Saved" : "Valid"));
            } else {
              setStatus(platform, "invalid", result.message || "Invalid");
            }
            updateSubmitState();
            resolve(state[platform]);
          })
          .withFailureHandler((error) => {
            state[platform] = { valid: false, checking: false, username: "" };
            setStatus(platform, "invalid", error.message || "Validation failed");
            updateSubmitState();
            resolve(state[platform]);
          })
          .validateHandle(platform, username);
      });
    }

    function setStatus(platform, className, text) {
      const status = document.getElementById(platform + "-status");
      status.className = "status " + className;
      status.textContent = text;
    }

    function updateSubmitState() {
      const detailsOk = ["name", "email"].every((name) => form.elements[name].value.trim());
      const handlesOk = Object.keys(platformConfig).every((platform) => state[platform] && state[platform].valid);
      const checking = Object.keys(platformConfig).some((platform) => state[platform] && state[platform].checking);
      button.disabled = !detailsOk || !handlesOk || checking;
    }

    function debounce(fn, wait) {
      let timer;
      return function debounced() {
        clearTimeout(timer);
        timer = setTimeout(fn, wait);
      };
    }
  </script>
</body>
</html>`;
}

function renderHandleRow(key, placeholder) {
  const config = PLATFORM_CONFIG[key];
  const required = config.required ? "required" : "";
  return `<section class="handle-row">
    <label for="${key}">${escapeHtml(config.label)}</label>
    <div>
      <input id="${key}" name="${key}" type="text" autocomplete="off" placeholder="${escapeHtml(placeholder)}" ${required}>
      <p class="help">${config.help}</p>
    </div>
    <div id="${key}-status" class="status idle">${config.required ? "Required" : "Optional"}</div>
  </section>`;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}
