
document.addEventListener("DOMContentLoaded", () => {
        startGame();
});

class Die {
        sides = [1, 2, 3, 4, 5, 6];

        roll() {
                const ranNum = Math.floor(Math.random() * this.sides.length);
                return (this.sides[ranNum]);
        }
}

var dice = [new Die(), new Die(), new Die(), new Die(), new Die()];
var currentRoll = [0, 0, 0, 0, 0];
var canScore = true;
var availableRerolls = 1;
const diceDic = ["", "one", "two", "three", "four", "five", "six"];

const startGame = () => {
        rollDice();

        calcUpperSectionTotal();
        calcLowerSectionTotal();

        availableRerolls = 3;
        updateRerollCount();
}

const selectDie = (event) => {
        const button = event.target;
        if (button.classList.contains('keep')) {
                button.classList.replace('keep', 'reroll');
        } else {
                button.classList.replace('reroll', 'keep');
        }
}

const rollDice = () => {
        if (availableRerolls == 0) {
                return;
        }

        const diceEl = document.querySelectorAll('.dice .die');
        for (let i = 0; i < dice.length; i++) {
                const dieEl = diceEl[i];
                // skip dice marked with "keep"
                if (dieEl.querySelector('.state.keep') !== null) {
                        continue;
                }

                const roll = dice[i].roll();
                dieEl.querySelector('.value').classList = `value ${diceDic[roll]}`;

                currentRoll[i] = roll;
        }

        availableRerolls--;
        updateRerollCount();

        canScore = true;
        document.querySelector('.scoreboard .sheet').classList.remove('blocked');
}

const updateRerollCount = () => {
        const counter = document.querySelector('.reroll_count');
        counter.innerHTML = `Available Re-Rolls: ${availableRerolls}`;
}

const writePoints = (event) => {
        if (!canScore) {
                return;
        }

        // clicked cell was already highlighted for being nulled
        if (event.target.classList.contains('cell') && event.target.classList.contains('null')) {
                const targetCell = event.target;

                targetCell.innerHTML = "X";
                targetCell.classList.remove("null");

                // reset re-rolls
                availableRerolls = 3;
                updateRerollCount();
        }

        // empty cell was clicked - write points in cell
        if (event.target.classList.contains('cell') && event.target.classList.contains('empty')) {
                const targetCell = event.target;
                const points = checkScoreboardPatterns(targetCell.parentElement.classList[1]);

                if (points !== null) {
                        targetCell.innerHTML = points;
                        targetCell.classList.remove("empty");

                        // also check if a section is complete and calc the total
                        calcUpperSectionTotal();
                        calcLowerSectionTotal();

                        // reset re-rolls
                        availableRerolls = 3;
                        updateRerollCount();

                        // block writing points in any other cell after doing it once before re-rolling
                        canScore = false;
                        document.querySelector('.scoreboard .sheet').classList.add('blocked');

                        resetDiceKeeping();
                        resetNullCell();
                } else {
                        // points cannot be written in the cell - show prompt to null the cell

                        resetNullCell();

                        targetCell.classList.replace('empty', 'null');
                }
        }
}

// reset any cell that was marked to be nulled previously
const resetNullCell = () => {
        const nullCell = document.querySelector('.cell.null');
        if (nullCell != null) {
                nullCell.classList.replace('null', 'empty');
        }
}

const resetDiceKeeping = () => {
        const keepStates = document.querySelectorAll('.die .state.keep');
        for (let i = 0; i < keepStates.length; i++) {
                keepStates[i].classList.replace('keep', 'reroll');
        }
}

const checkScoreboardPatterns = (rowType) => {
        let returnPoints = 0;

        const matches = rowType.match(/([a-zA-Z]*)_(\d*)/);
        const patternType = matches[1];
        const targetNumber = matches[2];

        // numbers are easy, just count them
        if (patternType == "count") {
                const needleNumber = currentRoll.filter((number) => number == targetNumber);

                if (needleNumber.length > 0) {
                        returnPoints = needleNumber.length * needleNumber[0];
                }
        }

        // straights are also easy, just sort alphabetically and check if the numbers go up by one
        if (patternType == "straight") {
                const testArr = currentRoll.toSorted();

                let straightLength = 0;
                let lastNum = null;
                for (let i = 0; i < testArr.length; i++) {
                        const currentNum = testArr[i];

                        if (lastNum == null) {
                                straightLength = 1;
                        } else {
                                if (currentNum == lastNum + 1) {
                                        straightLength++;
                                } else {
                                        straightLength = 1;
                                }
                        }

                        if (straightLength == targetNumber) {
                                returnPoints = targetNumber * 10 - 10;
                                break;
                        }

                        lastNum = currentNum;
                }

                if (returnPoints == 0) {
                        return null;
                }
        }

        // the rest should be easy to do by counting all occurrences of all numbers
        if (patternType == "kind") {
                const occurrences = {
                        1: 0,
                        2: 0,
                        3: 0,
                        4: 0,
                        5: 0,
                        6: 0
                };

                for (let i = 0; i < currentRoll.length; i++) {
                        const num = currentRoll[i];

                        occurrences[num]++;
                }

                const mostPresentNum = Object.keys(occurrences).reduce((a, b) => occurrences[a] > occurrences[b] ? a : b);
                if (occurrences[mostPresentNum] >= targetNumber) {
                        // yahtzee case
                        if (targetNumber == 5) {
                                returnPoints = 50;
                        } else {
                                returnPoints = currentRoll.reduce((partialSum, a) => partialSum + a, 0);
                        }
                } else {
                        return null;
                }
        }

        // full house is just a straight 3 but we check if there are only two types of dice present
        if (patternType == "house") {
                const occurrences = {
                        1: 0,
                        2: 0,
                        3: 0,
                        4: 0,
                        5: 0,
                        6: 0
                };

                for (let i = 0; i < currentRoll.length; i++) {
                        const num = currentRoll[i];

                        occurrences[num]++;
                }

                const reducedOcc = Object.keys(occurrences).filter(key => occurrences[key] !== 0).reduce((newObj, key) => {
                        newObj[key] = occurrences[key];
                        return newObj;
                }, {});

                // todo: atm a 4-1 ratio counts as a full house
                if (Object.keys(reducedOcc).length > 2) {
                        return null;
                }

                returnPoints = 25;
        }

        // chance you just sum everything
        if (patternType == "chance") {
                returnPoints = currentRoll.reduce((partialSum, a) => partialSum + a, 0);
        }

        return returnPoints;
}

const calcUpperSectionTotal = () => {
        const upperRows = document.querySelectorAll('.row[class*="count_"]');
        let total = 0;

        for (let i = 0; i < upperRows.length; i++) {
                total += Number(upperRows[i].lastElementChild.innerHTML);
        }

        document.querySelector('.row.total_b').lastElementChild.innerHTML = total;

        if (total >= 63) {
                document.querySelector('.row.bonus').lastElementChild.innerHTML = 35;
        } else {
                document.querySelector('.row.bonus').lastElementChild.innerHTML = 0;
        }

        const totalUs = document.querySelectorAll('.row.total_u');
        for (let i = 0; i < totalUs.length; i++) {
                totalUs[i].lastElementChild.innerHTML = total + Number(document.querySelector('.row.bonus').lastElementChild.innerHTML);
        }
}

const calcLowerSectionTotal = () => {
        const lowerRows = document.querySelectorAll('.row[class*="kind_"], .row[class*="straight_"], .row.house_0, .row.chance_0');

        let total = 0;
        for (let i = 0; i < lowerRows.length; i++) {
                const cellText = lowerRows[i].lastElementChild.innerHTML;
                const cellValue = (Number(cellText)) ? Number(cellText) : 0;
                total += cellValue;
        }

        document.querySelector('.row.total_l').lastElementChild.innerHTML = total;
        document.querySelector('.row.total_g').lastElementChild.innerHTML = total + Number(document.querySelector('.row.total_u').lastElementChild.innerHTML);
}