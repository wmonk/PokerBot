var Promise = require('bluebird');
var request = Promise.promisify(require('request'));

function Game(p1, p2, opts) {
	var handsPlayed = 300;
	var pot = 0;

	this.p1 = p1;
	this.p2 = p2;

	this.p1.chips = 100;
	this.p2.chips = 100;

	postBlind()
		.then(recieveButton)
		.then(function () {
			return playHand(p1);
		});

	function informPlayers(p1, p2) {
		console.log('informing both players');

		return Promise.all([
			request({
				method: 'post',
				url: p1.url + 'update',
				form: {
					card: '5'
				}
			}),
			request({
				method: 'post',
				url: p2.url + 'update',
				form: {
					card: '7'
				}
			})
		]).catch(function (err) {
			console.log(err);
		});
	}

	function postBlind() {
		console.log('posting blind to', p1.name);
		p1.chips--;
		pot++;

		return Promise.resolve();
	}

	function recieveButton() {
		console.log('recieving button to', p2.name);
		console.log('\n\n');

		return Promise.resolve();
	}

	function askMove(player) {
		console.log('asking for move from', player.name);

		var moves = ['BET', 'FOLD'];

		move = moves[Math.floor(Math.random() * moves.length)];

		if (move === 'BET') {
			player.chips--;
			pot++;
		}

		return request(player.url)
			.spread(function (resp, move) {
				return Promise.resolve(move);
			});
	}

	function informMove(player) {
		console.log('informing move to', player.name);

		return Promise.resolve();
	}

	function playHand(player) {
		if (handsPlayed === 0) {
			if (p1.chips > p2.chips) {
				console.log(p1.name, 'has won!');
			} else if (p2.chips > p1.chips) {
				console.log(p2.name, 'has won!');
			} else {
				console.log('Draw!');
			}

			return;
		}

		var player2 = player.name === p1.name ? p2 : p1;

		informPlayers(player, player2)
			.then(function () {
				return askMove(player);
			})
			.then(function (move) {
				if (move === 'FOLD') {
					console.log(player.name, 'has folded');
					player2.chips += pot;
					pot = 0;

					return Promise.reject();
				}

				if (move === 'BET' || move === 'CALL') {
					console.log(player.name, 'has bet');
				}

				return informMove(p2);
			})
			.then(function gameOver (gameOver) {
				playHand(player2);
			})
			.catch(function () {
				handsPlayed--;

				console.log('***');
				console.log(player.name, 'has', player.chips, 'chips');
				console.log(player2.name, 'has', player2.chips, 'chips');

				console.log('hand ended');
				console.log('\n\n');

				playHand(player2);
			});
	}
}

var players = [{
	name: 'computron',
	url: 'http://10.44.14.204:3000/'
}, {
	name: 'stackattack',
	url: 'http://10.44.14.204:3000/'
}];

new Game(players[0], players[1]);
