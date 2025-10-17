
Math.lerp = function(a, b, t) {
        return a + (b - a) * t;
}

var game;

document.addEventListener("DOMContentLoaded", () => {
        game = new Game();
        game.start();
});

document.addEventListener('keydown', (e) => {
        if (e.code == "Space") {
                game.toggleSheet();
        }
});

class Die {
        sides;
        value;
        dieEl;
        keep = false;

        constructor(sides = [1, 2, 3, 4, 5, 6]) {
                this.sides = sides;
        }

        roll() {
                // void rendered element
                this.dieEl = null;

                // calc randomized value from sides
                const ranNum = Math.floor(Math.random() * this.sides.length);
                this.value = this.sides[ranNum];

                return this.value;
        }

        toggleKeep() {
                this.keep = !this.keep;
                this.dieEl.firstElementChild.classList.toggle('keep');
        }

        randomStyle() {
                // get bounds of dice area 
                const minX = 0;
                const minY = 100;
                const maxX = game.diceAreaEl.clientWidth;
                const maxY = game.diceAreaEl.clientHeight - 100;

                // calc random position in area
                const randX = Math.lerp(minX, maxX, Math.random());
                const randY = Math.lerp(minY, maxY, Math.random());

                this.dieEl.style.top = `${randY}px`;
                this.dieEl.style.left = `${randX}px`;

                // calc random rotation
                const randRot = Math.lerp(0, 360, Math.random());

                this.dieEl.firstElementChild.style.transform = `rotate(${randRot}deg)`;
        }

        render() {
                if (this.dieEl == null) {
                        // Wrapper
                        const wrapper = document.createElement('div');
                        wrapper.classList.add('die_wrapper');

                        // Die
                        const dieEl = document.createElement('div');
                        dieEl.classList.add('die');
                        dieEl.dataset.value = this.value;
                        if (this.keep) {
                                dieEl.classList.add('keep');
                        }

                        // Eyes
                        for (let i = 0; i < this.value; i++) {
                                const eye = document.createElement('div');
                                eye.classList.add('eye');

                                dieEl.appendChild(eye);
                        }

                        // Event Handling
                        dieEl.addEventListener('mouseenter', (e) => {
                                if (e.buttons == 1) {
                                        this.toggleKeep();
                                }
                        });
                        dieEl.addEventListener('mousedown', (e) => {
                                if (e.buttons == 1) {
                                        this.toggleKeep();
                                }
                        });

                        wrapper.appendChild(dieEl);

                        this.dieEl = wrapper;

                        // apply random style
                        this.randomStyle();
                }

                return this.dieEl;
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
                        const currentDie = this.dice[i];

                        if (!currentDie.keep) {
                                currentDie.roll();
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
                }
        }

        clearDice() {
                for (let i = 0; i < this.dice.length; i++) {
                        const currentDie = this.dice[i];
                        if (currentDie.dieEl == null) {
                                continue;
                        }

                        if (!currentDie.keep) {
                                currentDie.dieEl.classList.add('vanish');
                                currentDie.dieEl.style.animationDelay = `${Math.random() * 0.25}s`;

                                // roll die once css animation is finished
                                currentDie.dieEl.getAnimations()[0].finished
                                .then(() => {
                                        currentDie.dieEl.classList.replace('vanish', 'nonexistant');
                                });
                        }
                }
        }

        correctDiePosition(die) {
                const minDistance = 90;

                for (let i = 0; i < this.dice.length; i++) {
                        const otherDie = this.dice[i];
                        if (die == otherDie) {
                                return false;
                        }

                        const otherDiePos = {
                                x: Number(otherDie.dieEl.style.left.replace('px', '')),
                                y: Number(otherDie.dieEl.style.top.replace('px', ''))
                        };

                        const diePos = {
                                x: Number(die.dieEl.style.left.replace('px', '')),
                                y: Number(die.dieEl.style.top.replace('px', ''))
                        };

                        const dieVec = {
                                x: otherDiePos.x - diePos.x,
                                y: otherDiePos.y - diePos.y
                        };

                        const distance = Math.sqrt((dieVec.x * dieVec.x) + (dieVec.y * dieVec.y));

                        if (distance <= minDistance) {
                                die.randomStyle();
                                return true;
                        }
                }

                return false;
        }

        render(parentEl) {
                // Dice Wrapper
                const diceWrapper = document.createElement('div');
                diceWrapper.classList.add('dice');

                // Dice
                for (let i = 0; i < this.dice.length; i++) {
                        const currentDie = this.dice[i];
                        currentDie.render();

                        // check if die is touching another and adjust position
                        if (!currentDie.keep) {
                                let touching = true;
                                while (touching) {
                                        touching = this.correctDiePosition(currentDie);
                                }

                                // show animation if it was re-rolled
                                currentDie.dieEl.classList.add('roll');
                                currentDie.dieEl.style.animationDelay = `${Math.random() * 0.25}s`;
                        } else {
                                currentDie.dieEl.classList.remove('roll');
                        }

                        diceWrapper.appendChild(currentDie.render());
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
                        return true;
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
                if (this.nulled) {
                        rowEl.classList.add('null');
                }

                rowEl.addEventListener('click', (e) => {
                        if (!game.canScore || this.scored) {
                                return;
                        }

                        game.pencilWrite(e.target.parentElement);

                        if (this.canScore(game.dice.formattedRoll)) {
                                this.score(game.dice.formattedRoll);
                        }

                        game.canScore = false;
                });
                rowEl.addEventListener('contextmenu', (e) => {
                        e.preventDefault();

                        if (!game.canScore || this.scored) {
                                return;
                        }

                        game.pencilWrite(e.target.parentElement, true);

                        this.nulled = true;
                        this.scored = true;
                        game.canScore = false;
                });

                // Name
                const nameCell = document.createElement('div');
                nameCell.classList.add('cell');
                nameCell.innerHTML = this.name;

                // Points
                const pointsCell = document.createElement('div');
                pointsCell.classList.add('cell');

                if (this.scored && !this.nulled) {
                        pointsCell.innerHTML = this.points;
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
        awarded = false;

        constructor(name, points, threshold) {
                this.name = name;
                this.points = points;
                this.threshold = threshold;
        }

        thresholdReached(points) {
                if (points >= this.threshold) {
                        this.awarded = true;
                }

                return this.awarded;
        }

        render() {
                const bonusEl = document.createElement('div');
                bonusEl.classList.add('row', 'bonus');

                const bonusNameCell = document.createElement('div');
                bonusNameCell.classList.add('cell');
                bonusNameCell.innerHTML = this.name;

                const bonusPointsCell = document.createElement('div');
                bonusPointsCell.classList.add('cell');
                bonusPointsCell.innerHTML = (this.awarded) ? this.points : 0;

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
        canScore = false;
        sheetParentEl = document.querySelector('.sheet_wrapper');
        highscoreEl = document.querySelector('#highscore');
        rerollCountEl = document.querySelector('#reroll-count');
        patternsEl = document.querySelector('#pattern-area');
        diceParentEl = document.querySelector('#dice-area');
        diceAreaEl = document.querySelector('#dice-area');
        notebookEl = document.querySelector('#notebook');
        pencilEl = document.querySelector('#pencil');
        diceDic = ["", "one", "two", "three", "four", "five", "six"];

        constructor() {
                this.createSheet();
                this.updateSheet();
        }

        start() {
                this.createSheet();
                this.updateSheet();
                this.updatePencil();

                this.resetRerolls();
        }

        resetRerolls() {
                this.availableRerolls = this.maxRerolls;
                this.updateRerolls();
        }

        updateRerolls() {
                this.rerollCountEl.innerHTML = `Available Re-Rolls: ${this.availableRerolls}`;
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
                const sheetParentLastChild = this.sheetParentEl.lastElementChild;
                if (sheetParentLastChild !== null && sheetParentLastChild.classList.contains('sheet')) {
                        this.sheetParentEl.removeChild(sheetParentLastChild);
                }

                this.sheetParentEl.appendChild(this.sheet.render());
        }

        updatePencil() {
                if (this.canScore) {
                        this.pencilEl.classList.remove('blocked');
                } else {
                        this.pencilEl.classList.add('blocked');
                }
        }

        toggleSheet() {
                // invisible on first load
                this.notebookEl.classList.remove('invisible');

                this.notebookEl.classList.toggle('hidden');
        }

        pencilWrite(el, strike = false) {
                el.appendChild(this.pencilEl);

                this.pencilEl.style.top = '-305px';
                this.pencilEl.style.left = '440px';
                this.pencilEl.style.transform = 'rotate(-116.5deg)';
                this.pencilEl.querySelector('.shadow').classList.remove('invisible');
                this.pencilEl.classList = 'writing';

                if (strike) {
                        this.pencilEl.style.left = '200px';
                        this.pencilEl.classList = 'striking';
                }

                // reset pencil once css animation is finished - or cancelled
                this.pencilEl.getAnimations()[0].finished
                .catch(() => {
                        console.log('animation cancelled');
                })
                .finally(() => {
                        this.notebookEl.appendChild(this.pencilEl);

                        this.pencilEl.style.top = '';
                        this.pencilEl.style.left = '';
                        this.pencilEl.style.transform = '';
                        this.pencilEl.querySelector('.shadow').classList.add('invisible');
                        this.pencilEl.classList.remove('writing', 'striking');

                        this.prepareNewRoll();
                });
        }

        updateHighscore(score) {
                this.highscore = score;
                this.highscoreEl.innerHTML = `High Score: ${this.highscore} Points`;
        }

        checkRollPattern() {
                // clear previous patterns
                while (this.patternsEl.lastElementChild) {
                        this.patternsEl.removeChild(this.patternsEl.lastElementChild);
                }

                // show new patterns
                const detectedNames = this.sheet.checkPatterns(this.dice.formattedRoll);
                for (let i = 0; i < detectedNames.length; i++) {
                        const patternEl = document.createElement('div');
                        patternEl.classList.add('pattern');
                        patternEl.innerHTML = detectedNames[i];

                        this.patternsEl.appendChild(patternEl);
                }
        }

        rollDice() {
                if (this.availableRerolls == 0) {
                        return;
                }

                if (this.canScore == false) {
                        this.canScore = true;
                        this.updateSheet();
                        this.updatePencil();
                }

                this.availableRerolls--;
                this.updateRerolls();

                this.dice.roll();
                this.dice.render(this.diceParentEl);

                this.checkRollPattern();
        }

        prepareNewRoll() {
                this.resetRerolls();
                this.updateSheet();
                this.updatePencil();

                this.dice.resetKeeping();
                this.dice.clearDice();

                if (this.sheet.checkCompletion()) {
                        this.updateHighscore(this.sheet.total);

                        if (window.confirm("Game complete! Do you want to restart?")) {
                                game.start();
                        }
                }
        }
}
