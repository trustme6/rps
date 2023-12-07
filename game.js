const { Table } = require('console-table-printer');
import('chalk').then(dynamicChalk => {
  const chalk = dynamicChalk.default || dynamicChalk;

  const crypto = require('crypto');

  class KeyGenerator {
    generateKey() {
      return crypto.randomBytes(32).toString('hex');
    }
  }

  class HMACGenerator {
    generateHMAC(key, message) {
      const hmac = crypto.createHmac('sha256', key);
      hmac.update(message);
      return hmac.digest('hex').toUpperCase();
    }
  }

  class Rules {
    constructor(moves) {
      this.moves = moves;
    }

    winsAgainst(moveA, moveB) {
      const movesLength = this.moves.length;
      const halfMoves = movesLength / 2;

      const indexA = this.moves.indexOf(moveA);
      const indexB = this.moves.indexOf(moveB);

      const diff = (indexB - indexA + movesLength) % movesLength;

      return diff > 0 && diff <= halfMoves;
    }
  }

  class HelpTableGenerator {
    constructor(rules, moves) {
      this.rules = rules;
      this.moves = moves;
    }

    generateCell(moveA, moveB) {
      if (moveA === moveB) {
        return chalk.gray('Draw');
      } else if (this.rules.winsAgainst(moveA, moveB)) {
        return chalk.green('Win');
      } else if (this.rules.winsAgainst(moveB, moveA)) {
        return chalk.red('Lose');
      } else {
        return chalk.gray('Draw');
      }
    }

    generateHelpTable() {
      const table = new Table({
        columns: [
          { name: 'v PC\\User >', alignment: 'center' },
          ...this.moves.map(move => ({ name: move, alignment: 'center' })),
        ],
      });

      this.moves.forEach((moveA) => {
        const row = {
          'v PC\\User >': moveA,
        };

        this.moves.forEach((moveB) => {
          row[moveB] = this.generateCell(moveA, moveB);
        });

        table.addRow(row);
      });

      // Print the table
      table.printTable();
    }
  }

  class Game {
    constructor(moves) {
      if (moves.length % 2 !== 1 || moves.length <= 1) {
        console.log(chalk.red('Invalid number of moves. Please provide an odd number of moves greater than 1.'));
        process.exit(1);
    }

      if (new Set(moves).size !== moves.length) {
        console.log(chalk.red('Invalid moves. Please provide unique moves.'));
        process.exit(1);
      }

      this.moves = moves;
      this.keyGenerator = new KeyGenerator();
      this.hmacGenerator = new HMACGenerator();
      this.rules = new Rules(moves);
      this.helpTableGenerator = new HelpTableGenerator(this.rules, moves);
    }

    playGame() {
      const key = this.keyGenerator.generateKey();
      const computerMoveIndex = Math.floor(Math.random() * this.moves.length);
      const computerMove = this.moves[computerMoveIndex];

      console.log(chalk.blue(`HMAC: ${this.hmacGenerator.generateHMAC(key, computerMove)}`));
      console.log(chalk.yellow("Available moves:"));
      this.moves.forEach((move, index) => console.log(chalk.yellow(`${index + 1} - ${move}`)));
      console.log(chalk.yellow("0 - Exit"));
      console.log(chalk.yellow("? - Help"));

      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(chalk.yellow("Enter your move: "), (answer) => {
        const playerMoveIndex = parseInt(answer, 10);

        if (isNaN(playerMoveIndex) || playerMoveIndex < 0 || playerMoveIndex > this.moves.length) {
          if (answer !== '?' && answer !== '0') {
            console.log(chalk.red("Invalid move. Please enter a valid move."));
            process.exit(1);
          }
        }

        if (answer === '?' || answer === '0') {
          if (answer === '?') {
              console.log("Help Table:");
              this.helpTableGenerator.generateHelpTable();
          }
      
          if (answer === '0') {
              console.log(chalk.blue("Bye!"));
          }
      
          rl.close();
          process.exit(0);
      }
        const playerMove = this.moves[playerMoveIndex - 1];
        this.determineWinner(playerMove, computerMove, key);

        rl.close();
      });
    }

    determineWinner(playerMove, computerMove, key) {
      console.log(chalk.yellow(`Your move: ${playerMove}`));
      console.log(chalk.yellow(`Computer's move: ${computerMove}`));

      if (playerMove === computerMove) {
        console.log(chalk.gray("It's a tie!"));
      } else if (this.rules.winsAgainst(playerMove, computerMove)) {
        console.log(chalk.green("You win!"));
      } else {
        console.log(chalk.red("Computer wins!"));
      }

      console.log(chalk.blue(`HMAC key: ${key}`));
    }
  }

  const args = process.argv.slice(2);
  const game = new Game(args);
  game.playGame();
});