var done = false;

function swissInitBracket(players) {
	//swissSeedPlayers();
	
	done = false;
	resetAllPlayers(players);
	for (let x = 0; x < players.length - 1; x += 2) {
		players[x].newRound(playerRoundStatuses.FIRST, players[x+1]);
		players[x+1].newRound(playerRoundStatuses.SECOND, players[x]);
	}
	if (players.length % 2 === 1)
		players[players.length-1].newRound(playerRoundStatuses.BYE);
}

function swissNextRound(players) {
	return matchPlayersByScoreBuckets(players);
}

function swissEndBracket(players) {
	done = true;
	return duplicateList(players).sort(comparePlayersByScoreAndFirstCount);
}

function matchPlayersByScoreBuckets(players) {
	let matchedPlayers = duplicateList(players);
	
	matchedPlayers.sort(comparePlayersByScoreAndFirstCount);
	let bucketStart = 0;
	let bucketEnd = findScoreBucketEnd(matchedPlayers, bucketStart);
	while ((bucketEnd - bucketStart) > 1 || bucketEnd < players.length) {
		let bucket = matchedPlayers.slice(bucketStart, bucketEnd);
		bucket = matchPlayersInScoreBucket(bucket);
		for (let x = bucketStart; x < bucketEnd; x++) {
			matchedPlayers[x] = bucket[x-bucketStart];
		}
		bucketStart += bucket.length - bucket.length % 2;
		bucketEnd = findScoreBucketEnd(matchedPlayers, bucketEnd);
		if ((bucketEnd - bucketStart) === 1) {
			matchedPlayers[matchedPlayers.length-1].newRound(playerRoundStatuses.BYE);
		}
	}
	return matchedPlayers;
}

function matchPlayersInScoreBucket(scoreBucket) {
	let matchedBucket = []
	updateAllPrevPlayerCount(scoreBucket);
	scoreBucket.sort(comparePlayersByFirstCount);
	
	for (let priority = scoreBucket.length - 2; priority > 0; priority--) {
		matchedBucket = matchedBucket.concat(matchPlayersWithPriority(priority, scoreBucket));
	}
	matchedBucket = matchedBucket.concat(matchRemainingPlayers(scoreBucket));
	return matchedBucket;
}

function matchPlayersWithPriority(priority, scoreBucket) {
	matchedPlayers = []
	
	for (let x = 0; x < scoreBucket.length; x++) {
		if (scoreBucket[x].prevPlayerCount % (scoreBucket.length - 1) === priority) {
			opponentIndex = findUniqueOpponentIndex(x, scoreBucket);
			if (opponentIndex === -1)
				continue;
			let firstPlayer = opponentIndex > x ? opponentIndex : x;
			let secondPlayer = opponentIndex < x ? opponentIndex : x;
			scoreBucket[firstPlayer].newRound(playerRoundStatuses.FIRST, scoreBucket[secondPlayer]);
			scoreBucket[secondPlayer].newRound(playerRoundStatuses.SECOND, scoreBucket[firstPlayer]);
			matchedPlayers = matchedPlayers.concat(scoreBucket.splice(firstPlayer, 1));
			matchedPlayers = matchedPlayers.concat(scoreBucket.splice(secondPlayer, 1));
		}
	}
	
	return matchedPlayers;
}

function matchRemainingPlayers(scoreBucket) {
	let matchedPlayers = [];
	let byePlayer = null;
	if (scoreBucket.length % 2 === 1) {
		randomIndex = Math.floor(Math.random() * scoreBucket.length);
		byePlayer = scoreBucket[randomIndex];
		scoreBucket.splice(randomIndex, 1);
	}
	
	let midPoint = Math.floor(scoreBucket.length / 2);
	for (let x = 0; x < midPoint; x++) {
		let firstPlayer = scoreBucket[scoreBucket.length - 1 - x];
		let secondPlayer = scoreBucket[x];
		firstPlayer.newRound(playerRoundStatuses.FIRST, secondPlayer);
		secondPlayer.newRound(playerRoundStatuses.SECOND, firstPlayer);
		matchedPlayers.push(firstPlayer);
		matchedPlayers.push(secondPlayer);
	}
	if (byePlayer !== null)
		matchedPlayers.push(byePlayer);
	return matchedPlayers;
}

function findPrevOpponentIndex(player, players) {
	result = -1;
	for (let x = 0;x < player.prevPlayers.length && result === -1;x++) {
		for(let x = 0;y < players.length && result === -1;y++) {
			if (player.prevPlayers[x] === players[y]) {
				result = y;
			}
		}
	}
	return result;
}

function findUniqueOpponentIndex(currentPlayerIndex, players) {
	let midPoint = Math.floor(players.length / 2);
	let searchDirection = (currentPlayerIndex - midPoint) / Math.abs(currentPlayerIndex - midPoint) * -1;
	let startIndex = searchDirection === 1 ? 0 : players.length - 1;
	for (x = startIndex; x < players.length && x >= 0; x += searchDirection) {
		if (x === currentPlayerIndex)
			continue;
		else {
			if (players[currentPlayerIndex].isUniqueOpponent(players[x]))
				return x;
		}
	}
	return -1;
}

function findScoreBucketEnd(players, bucketStart) {
	try {
		let currentScoreBucket = players[bucketStart].score;
		for (let x = bucketStart; x < players.length; x++) {
			if (currentScoreBucket !== players[x].score) {
				return x;
			}
		}
	} catch {}
	return players.length;
}

function updateAllPrevPlayerCount(players) {
	for (let player of players)
		player.updatePrevPlayerCount(players);
}

function resetAllPlayers(players) {
	for (let player of players)
		player.reset();
}

function comparePlayersByScoreAndFirstCount(a, b) {
	result = b.score - a.score;
	if (result === 0) {
		result = a.firstCount - b.firstCount;
	}
	return result;
}

function comparePlayersByFirstCount(a, b) {
	return b.firstCount - a.firstCount;
}

function swapListItems(list, index1, index2) {
	let temp = list[index1];
	list[index1] = list[index2];
	list[index2] = temp;
}

function moveItemToIndex(list, itemIndex, targetIndex) {
	temp = list[itemIndex];
	list.splice(itemIndex, 1);
	list.splice(targetIndex, 0, temp);
}

function duplicateList(list) {
	let result = []
	for (let item of list)
		result.push(item);
	return result;
}

function copyArrayObjects(array) {
	let result = [];
	for (let item of array)
		result.push(item.clone());
	return result;
}

/* garbage disposal
function findValidByePlayerIndex(players, startPoint) {
	let radius = 0;
	let rightFlag = false;
	let leftFlag = false;
	for (;!rightFlag || !leftFlag;radius++) {
		if (!rightFlag) {
			rightIndex = startPoint + radius;
			if (rightIndex >= players.length)
				rightFlag = true;
			else if (!players[rightIndex].hadBye)
				return rightIndex;
		}
		if (!leftFlag) {
			leftIndex = startPoint - radius;
			if (leftIndex < 0)
				leftFlag = true;
			else if (!players[startPoint-radius].hadBye)
				return startPoint - radius;
		}
	}
	throw "no valid bye player"
}*/

/*
function matchPlayersInScoreBucket(scoreBucket) {
	let matchedBucket = []
	
	scoreBucket.sort(comparePlayersByFirstCount);
	let midPoint = Math.floor((scoreBucket.length) / 2)
	for (let x = 0; x < midPoint; x ++) {
		let player1 = scoreBucket[x];
		let player2Index = findValidOpponentIndex(x, scoreBucket;
		let player2 = scoreBucket[player2Index];
		scoreBucket.splice(player2Index, 1);
		scoreBucket.splice(scoreBucket.length - x, 0, player2);
		matchedBucket.push(player2);
		matchedBucket.push(player1);
		player2.newRound(playerRoundStatuses.FIRST, player1);
		player1.newRound(playerRoundStatuses.SECOND, player2);
	}
	if (scoreBucket.length % 2 === 1)
		matchedBucket.push(scoreBucket[midPoint]);
	return matchedBucket;
}*/

/*
function createPriorityBuckets(players) {
	let buckets = [duplicateList(players),[]];
	
	for (let x = 0; x<buckets[0].length;x++) {
		prevOpponentIndex = findPrevOpponentIndex(buckets[0][x], buckets[0]);
		if (prevOpponentIndex !== -1) {
			buckets[1].concat(buckets[0].splice(prevOpponentIndex,1));
			buckets[1].concat(buckets[0].splice(x,1));
			x--;
		}
	}
	return buckets;
}*/