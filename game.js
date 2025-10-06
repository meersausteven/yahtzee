
var game;

document.addEventListener("DOMContentLoaded", () => {
        game = new Game();
        game.start();
});

class Die {
        sides;
        value;
        keep = false;
        frozen = true;

        constructor(sides = [1, 2, 3, 4, 5, 6]) {
                this.sides = sides;
        }

        roll() {
                this.frozen = false;

                const ranNum = Math.floor(Math.random() * this.sides.length);
                this.value = this.sides[ranNum];

                return this.value;
        }

        render() {
                // Die Wrapper
                const dieWrapper = document.createElement('div');
                dieWrapper.classList.add('die');

                // Die Value
                const valueEl = document.createElement('div');
                valueEl.classList.add('value', game.diceDic[this.value]);

                // Die State
                const stateEl = document.createElement('div');
                stateEl.classList.add('state', 'reroll');
                if (this.keep) {
                        stateEl.classList.replace('reroll', 'keep');
                }
                stateEl.addEventListener('click', () => {
                        if (this.frozen) {
                                return;
                        }

                        this.keep = !this.keep;

                        if (this.keep) {
                                stateEl.classList.replace('reroll', 'keep');
                        } else {
                                stateEl.classList.replace('keep', 'reroll');
                        }
                });

                dieWrapper.appendChild(valueEl);
                dieWrapper.appendChild(stateEl);

                return dieWrapper;
        }
}

class Dice {
        dice;
        formattedRoll;

        constructor(dice) {
                this.dice = dice;

                this.formatRoll();
        }

        roll() {
                for (let i = 0; i < this.dice.length; i++) {
                        if (!this.dice[i].keep) {
                                this.dice[i].roll();
                        }
                }

                this.formatRoll();
        }

        formatRoll() {
                const sortedRoll = Array.from({length:6}, (_, i) => i = 0);
                for (let i = 0; i < this.dice.length; i++) {
                        const dieValue = this.dice[i].value;

                        sortedRoll[dieValue - 1] += 1;
                }

                this.formattedRoll = sortedRoll.join("");
        }

        resetKeeping() {
                for (let i = 0; i < this.dice.length; i++) {
                        this.dice[i].keep = false;
                        this.dice[i].frozen = true;
                }
        }

        render(parentEl) {
                // Dice Wrapper
                const diceWrapper = document.createElement('div');
                diceWrapper.classList.add('dice');

                // Dice
                for (let i = 0; i < this.dice.length; i++) {
                        diceWrapper.appendChild(this.dice[i].render());
                }

                // clear already existent dice
                const diceEl = parentEl.querySelector('.dice');
                if (diceEl != null) {
                        parentEl.removeChild(diceEl);
                }

                parentEl.prepend(diceWrapper);
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

                        if (this.canScore(game.dice.formattedRoll)) {
                                this.score(game.dice.formattedRoll);
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
        dice = new Dice([new Die(), new Die(), new Die(), new Die(), new Die()]);
        maxRerolls = 3;
        availableRerolls = 0;
        highscore = 0;
        sheetParentEl = document.querySelector('.scoreboard');
        highscoreEl = document.querySelector('.highscore');
        patternsEl = document.querySelector('.patterns');
        diceParentEl = document.querySelector('.roll_area');
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
                this.updateRerolls();
        }

        updateRerolls() {
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
                const detectedNames = this.sheet.checkPatterns(this.dice.formattedRoll);
                this.patternsEl.innerHTML = detectedNames.join(' - ');
        }

        rollDice() {
                if (this.availableRerolls == 0) {
                        return;
                }

                this.availableRerolls--;
                this.updateRerolls();

                this.dice.roll();
                this.dice.render(this.diceParentEl);

                this.checkRollPattern();

                this.sheet.show();
                this.updateSheet();
        }

        prepareNewRoll() {
                this.resetRerolls();
                this.sheet.checkCompletion();
                this.updateSheet();

                this.dice.resetKeeping();
                this.dice.render(this.diceParentEl);
        }
}
