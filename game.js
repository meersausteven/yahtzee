
var game;

document.addEventListener("DOMContentLoaded", () => {
        game = new Game();
        game.start();
});

class Die {
        sides;

        constructor(sides = [1, 2, 3, 4, 5, 6]) {
                this.sides = sides;
        }

        roll() {
                const ranNum = Math.floor(Math.random() * this.sides.length);
                return (this.sides[ranNum]);
        }
}

class Sheet {
        sections;
        hidden = false;
        total = 0;

        constructor(sections) {
                this.sections = sections;
        }

        checkPatterns(roll) {
                const scorablePatterns = [];
                for (let i = 0; i < this.sections.length; i++) {
                        const sectionsPatterns = this.sections[i].checkPatterns(roll);

                        if (sectionsPatterns.length > 0) {
                                scorablePatterns.push(...sectionsPatterns);
                        }
                }

                return scorablePatterns;
        }

        checkCompletion() {
                this.total = 0;
                let completedSections = 0;
                for (let i = 0; i < this.sections.length; i++) {
                        this.sections[i].checkCompletion();
                        this.total += this.sections[i].total;

                        if (this.sections[i].complete) {
                                completedSections++;
                        }
                }

                if (completedSections == this.sections.length) {
                        game.updateHighscore(this.total);

                        if (window.confirm("Game complete! Do you want to restart?")) {
                                game.start();
                        }
                }

                return false;
        }

        hide() {
                this.hidden = true;
        }

        show() {
                this.hidden = false;
        }

        render() {
                // Sheet Wrapper
                const sheetEl = document.createElement('div');
                sheetEl.classList.add('sheet');
                if (this.hidden) {
                        sheetEl.classList.add('hidden');
                }

                // Sections
                for (let i = 0; i < this.sections.length; i++) {
                        const sectionEl = this.sections[i].render();
                        sheetEl.appendChild(sectionEl);
                }

                // Grand Total
                const totalEl = document.createElement('div');
                totalEl.classList.add('row', 'header', 'total');

                const totalTitleEl = document.createElement('div');
                totalTitleEl.classList.add('cell');
                totalTitleEl.innerHTML = "Grand Total";

                const totalPointsEl = document.createElement('div');
                totalPointsEl.classList.add('cell');
                totalPointsEl.innerHTML = this.total;

                totalEl.appendChild(totalTitleEl);
                totalEl.appendChild(totalPointsEl);

                sheetEl.appendChild(totalEl);

                return sheetEl;
        }
}

class SheetSection {
        name;
        rows;
        bonus;
        total = 0;
        complete = false;

        constructor(name, rows, bonus = null) {
                this.name = name;
                this.rows = rows;
                this.bonus = bonus;
        }

        calcTotal() {
                this.total = 0;
                for (let i = 0; i < this.rows.length; i++) {
                        this.total += this.rows[i].points;
                }

                if ((this.bonus !== null) && (this.bonus.thresholdReached(this.total))) {
                        this.total += this.bonus.points;
                }
        }

        checkPatterns(roll) {
                const scorablePatterns = [];
                for (let i = 0; i < this.rows.length; i++) {
                        if (this.rows[i].checkPattern(roll)) {
                                scorablePatterns.push(this.rows[i].name);
                        }
                }

                return scorablePatterns;
        }

        checkCompletion() {
                let completedRows = 0;
                for (let i = 0; i < this.rows.length; i++) {
                        if (this.rows[i].scored) {
                                completedRows++;
                        }
                }

                if (completedRows == this.rows.length) {
                        this.calcTotal();
                        this.complete = true;

                        return true;
                }
        }

        render() {
                // Section Wrapper
                const sectionEl = document.createElement('div');
                sectionEl.classList.add('section');

                // Section Title
                const titleEl = document.createElement('div');
                titleEl.classList.add('row', 'header');

                const titleCell = document.createElement('div');
                titleCell.classList.add('cell');
                titleCell.innerHTML = this.name;

                const pointsCell = document.createElement('div');
                pointsCell.classList.add('cell');
                pointsCell.innerHTML = "Points";

                titleEl.appendChild(titleCell);
                titleEl.appendChild(pointsCell);

                sectionEl.appendChild(titleEl);

                // Section Rows
                for (let i = 0; i < this.rows.length; i++) {
                        const rowEl = this.rows[i].render();
                        sectionEl.appendChild(rowEl);
                }

                // Section Bonus
                if (this.bonus !== null) {
                        sectionEl.appendChild(this.bonus.render());
                }

                // Section Total
                const totalEl = document.createElement('div');
                totalEl.classList.add('row', 'total');

                const totalNameCell = document.createElement('div');
                totalNameCell.classList.add('cell');
                totalNameCell.innerHTML = "Section Total";

                const totalPointsCell = document.createElement('div');
                totalPointsCell.classList.add('cell');
                totalPointsCell.innerHTML = this.total;

                totalEl.appendChild(totalNameCell);
                totalEl.appendChild(totalPointsCell);

                sectionEl.appendChild(totalEl);

                return sectionEl;
        }
}

class SheetRow {
        name;
        pattern;
        scoreRule;
        points = 0;
        scored = false;
        nulling = false;
        nulled = false;

        constructor(name, pattern = null, scoreRule = [1, 1, 1, 1, 1, 1]) {
                this.name = name;
                this.pattern = pattern;
                this.scoreRule = scoreRule;
        }

        checkPattern(roll) {
                return roll.match(this.pattern);
        }

        canScore(roll) {
                if ((this.scored == true) || (this.nulled == true)) {
                        return false;
                }

                if (this.pattern == null) {
                        return true;
                }

                return this.checkPattern(roll);
        }

        score(roll) {
                if (this.scoreRule instanceof Array) {
                        let sum = 0;
                        for (let i = 0; i < this.scoreRule.length; i++) {
                                const digitMult = this.scoreRule[i];
                                sum += roll[i] * (i + 1) * digitMult;
                        }

                        this.points = sum;
                } else {
                        this.points = this.scoreRule;
                }

                this.scored = true;
        }

        render() {
                // Row Wrapper
                const rowEl = document.createElement('div');
                rowEl.classList.add('row');
                if (!this.scored) {
                        rowEl.classList.add('empty');
                }

                rowEl.addEventListener('click', () => {
                        if (this.scored) {
                                return;
                        }

                        if (this.nulling) {
                                this.nulled = true;
                                this.scored = true;

                                game.prepareNewRoll();

                                return;
                        }

                        if (this.canScore(game.getCurrentRollString())) {
                                this.score(game.getCurrentRollString());
                        } else {
                                this.nulling = true;
                        }

                        game.prepareNewRoll();
                });

                // Name
                const nameCell = document.createElement('div');
                nameCell.classList.add('cell');
                nameCell.innerHTML = this.name;

                // Points
                const pointsCell = document.createElement('div');
                pointsCell.classList.add('cell');
                if (this.nulling) {
                        pointsCell.classList.add('null');
                }

                if (this.scored) {
                        pointsCell.innerHTML = this.points;
                }
                if (this.nulled) {
                        pointsCell.innerHTML = "X";
                }

                rowEl.appendChild(nameCell);
                rowEl.appendChild(pointsCell);

                return rowEl;
        }
}

class SheetSectionBonus {
        name;
        points;
        threshold;

        constructor(name, points, threshold) {
                this.name = name;
                this.points = points;
                this.threshold = threshold;
        }

        thresholdReached(points) {
                if (points >= this.threshold) {
                        return true;
                }
        }

        render() {
                const bonusEl = document.createElement('div');
                bonusEl.classList.add('row', 'bonus');

                const bonusNameCell = document.createElement('div');
                bonusNameCell.classList.add('cell');
                bonusNameCell.innerHTML = this.name;

                const bonusPointsCell = document.createElement('div');
                bonusPointsCell.classList.add('cell');
                bonusPointsCell.innerHTML = (this.thresholdReached()) ? this.points : 0;

                bonusEl.appendChild(bonusNameCell);
                bonusEl.appendChild(bonusPointsCell);

                return bonusEl;
        }
}

class Game {
        sheet = null;
        sheetParentEl = document.querySelector('.scoreboard');
        highscoreEl = document.querySelector('.highscore');
        patternsEl = document.querySelector('.patterns');
        dice = [new Die(), new Die(), new Die(), new Die(), new Die()];
        maxRerolls = 3;
        availableRerolls = 0;
        currentRoll = [0, 0, 0, 0, 0];
        highscore = 0;
        diceDic = ["", "one", "two", "three", "four", "five", "six"];

        constructor() {
                this.createSheet();
                this.updateSheet();
        }

        start() {
                this.createSheet();
                this.updateSheet();

                this.resetRerolls();
        }

        resetRerolls() {
                this.availableRerolls = this.maxRerolls;

                const counter = document.querySelector('.reroll_count');
                counter.innerHTML = `Available Re-Rolls: ${this.availableRerolls}`;
        }

        createSheet() {
                const upperSection = new SheetSection(
                        "Upper Section",
                        [
                                new SheetRow("Aces", null, [1]),
                                new SheetRow("Twos", null, [0, 1]),
                                new SheetRow("Threes", null, [0, 0, 1]),
                                new SheetRow("Fours", null, [0, 0, 0, 1]),
                                new SheetRow("Fives", null, [0, 0, 0, 0, 1]),
                                new SheetRow("Sixes", null, [0, 0, 0, 0, 0, 1])
                        ],
                        new SheetSectionBonus("Bonus", 35, 63)
                );
                const lowerSection = new SheetSection(
                        "Lower Section",
                        [
                                new SheetRow("3 of a Kind", /(3|4|5)/, [1, 1, 1, 1, 1, 1]),
                                new SheetRow("4 of a Kind", /(4|5)/, [1, 1, 1, 1, 1, 1]),
                                new SheetRow("Full House", /(2.*3|3.*2)/, 25),
                                new SheetRow("Small Straight", /0*[1-2]{4}0*/, 30),
                                new SheetRow("Large Straight", /0*1{5}0*/, 40),
                                new SheetRow("Yahtzee", /(5)/, 50),
                                new SheetRow("Chance", null, [1, 1, 1, 1, 1, 1])
                        ]
                );
                this.sheet = new Sheet([upperSection, lowerSection]);
        }

        updateSheet() {
                if (this.sheetParentEl.lastElementChild.classList.contains('sheet')) {
                        this.sheetParentEl.removeChild(this.sheetParentEl.lastElementChild);
                }

                this.sheetParentEl.appendChild(this.sheet.render());
        }

        getCurrentRollString() {
                const sortedRoll = Array.from({length:6}, (_, i) => i = 0);
                for (let i = 0; i < this.currentRoll.length; i++) {
                        const currentRollNum = this.currentRoll[i];

                        sortedRoll[currentRollNum - 1] += 1;
                }

                return sortedRoll.join("");
        }

        updateHighscore(score) {
                this.highscore = score;
                this.highscoreEl.innerHTML = `High Score: ${this.highscore} Points`;
        }

        checkRollPattern() {
                const detectedNames = this.sheet.checkPatterns(this.getCurrentRollString());
                this.patternsEl.innerHTML = detectedNames.join(' - ');
        }

        rollDice() {
                if (this.availableRerolls == 0) {
                        return;
                }

                const diceEl = document.querySelectorAll('.dice .die');
                for (let i = 0; i < this.dice.length; i++) {
                        const dieEl = diceEl[i];
                        // skip dice marked with "keep"
                        if (dieEl.querySelector('.state.keep') !== null) {
                                continue;
                        }

                        const roll = this.dice[i].roll();
                        dieEl.querySelector('.value').classList = `value ${this.diceDic[roll]}`;

                        this.currentRoll[i] = roll;
                }

                this.availableRerolls--;
                this.resetRerolls();
                this.checkRollPattern();

                this.sheet.show();
                this.updateSheet();
        }

        prepareNewRoll() {
                this.resetRerolls();
                this.sheet.checkCompletion();
                this.updateSheet();

                resetDiceKeeping();
        }
}

const selectDie = (event) => {
        const button = event.target;
        if (button.classList.contains('keep')) {
                button.classList.replace('keep', 'reroll');
        } else {
                button.classList.replace('reroll', 'keep');
        }
}

const resetDiceKeeping = () => {
        const keepStates = document.querySelectorAll('.die .state.keep');
        for (let i = 0; i < keepStates.length; i++) {
                keepStates[i].classList.replace('keep', 'reroll');
        }
}
