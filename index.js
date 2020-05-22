const { Engine, Render, Runner, World, Bodies, Body, Events, MouseConstraint, Mouse } = Matter;

let hBoxInput = document.querySelector('.box #hBox');
let vBoxInput = document.querySelector('.box #vBox');
let submitButton = document.querySelector('.box #submit');

// console.log(hBoxInput, vBoxInput, submitButton);

submitButton.addEventListener('click', event => {
    document.querySelector('.box').classList.add('hideDiv');
    document.querySelector('.mazeView').classList.remove('hideDiv');

    let engine = Engine.create();
    drawMaze(engine);

    hBoxInput = document.querySelector('.mazeView #hBox');
    vBoxInput = document.querySelector('.mazeView #vBox');
    submitButton = document.querySelector('.mazeView #submit');
    // console.log(hBoxInput, vBoxInput, submitButton);
    submitButton.addEventListener('click', event => {
        // console.log('dddd');
        document.querySelector('.winner').classList.add('hidden');
        let mazeElement = document.querySelector('canvas');
        mazeElement.parentNode.removeChild(mazeElement);
        // console.log(document.querySelector('.maze'));
        engine = Engine.create();
        drawMaze(engine);
    });
    
});

const drawMaze = (engine) => {
    const mazeDiv = document.querySelector('.maze');    //  To get the object of 'div' in which we want to render the maze.
    const cellsHorizontal = parseInt(hBoxInput.value);
    const cellsVertical = parseInt(vBoxInput.value);
    const width = window.innerWidth * 0.998;
    const height = window.innerHeight * 0.89;

    const unitLengthX = width / cellsHorizontal;
    const unitLengthY = height / cellsVertical;

    // console.log(cellsHorizontal, cellsVertical, unitLengthX, unitLengthY);
    const { world } = engine;
    engine.world.gravity.y = 0; //  To disable 'gravity' in "y" direction.

    const render = Render.create({
        element: mazeDiv,
        engine: engine,
        options: {
            wireframes: false,  //  To give random solid colors to shapes, set this to "false".
            width,
            height
        }
    })
    Render.run(render);
    Runner.run(Runner.create(), engine);

    //  To add Mouse Drag.
    World.add(world, MouseConstraint.create(engine, {
        mouse: Mouse.create(render.canvas)
    }));

    //  Walls
    const walls = [
        Bodies.rectangle(width/2, 0, width, 30, { isStatic: true, render: { fillStyle: 'red' }}),   //  Top
        Bodies.rectangle(width/2, height, width, 30, { isStatic: true, render: { fillStyle: 'red' }}), //  Bottom
        Bodies.rectangle(0, height/2, 30, height, { isStatic: true, render: { fillStyle: 'red' }}),   //  Left
        Bodies.rectangle(width, height/2, 40, height, { isStatic: true, render: { fillStyle: 'red' }}) //  Right
    ]
    World.add(world, walls);

    //  Maze Generation

    const shuffle = (arr) => {
        let counter = arr.length;
        while(counter > 0) {
            const index = Math.floor(Math.random() * counter);
            counter--;

            const temp = arr[counter];
            arr[counter] = arr[index];
            arr[index] = temp;
        }
        return arr;
    };

    const grid = Array(cellsVertical).fill(null).map( () => Array(cellsHorizontal).fill(false) );
    const verticals = Array(cellsVertical).fill(null).map( () => Array(cellsHorizontal-1).fill(false) );
    const horizontals = Array(cellsVertical-1).fill(null).map( () => Array(cellsHorizontal).fill(false) );
    // console.log(grid, verticals, horizontals);

    const startRow = Math.floor(Math.random()*cellsVertical);
    const startColumn = Math.floor(Math.random()*cellsHorizontal);
    // console.log(startRow, startColumn);

    const stepThroughCell = (row, column) => {
        //  If I have visited the cell at [row, column], then return.
        if( grid[row][column] ) {
            return;
        }

        //  Mark this cell as being visited.
        grid[row][column] = true;

        //  Assemble randomly-ordered list of neighbors.
        const neighbors = shuffle([
            [row - 1, column, 'up'],
            [row, column + 1, 'right'],
            [row + 1, column, 'down'],
            [row, column - 1, 'left']
        ]);
        // console.log(neighbors);

        //  For each neighbor...
        for(let neighbor of neighbors) {
            const [nextRow, nextColumn, direction] = neighbor;

            //  See if that neighbor is out of bounds.
            if(nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
                continue;
            }

            //  If we have visited that neighbor, continue to next neighbor.
            if(grid[nextRow][nextColumn]) {
                continue;
            }

            //  Remove a wall from either horizontals or verticals.
            if(direction === 'left') {
                verticals[row][column-1] = true;
            } else if(direction === 'right') {
                verticals[row][column] = true;
            } else if(direction === 'up') {
                horizontals[row-1][column] = true;
            } else if(direction === 'down') {
                horizontals[row][column] = true;
            }
            //  Visit that next cell.
            stepThroughCell(nextRow, nextColumn);
        }
    };

    stepThroughCell(startRow, startColumn);

    //  Drawing Horizontal Lines
    horizontals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
            if(open) {
                return;
            }

            const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX / 2,
                rowIndex * unitLengthY + unitLengthY,
                unitLengthX,
                5,
                {
                    label: 'wall',
                    isStatic: true,
                    render: {
                        fillStyle: 'orange'
                    }
                }
            );
            World.add(world, wall);
        });
    });

    //  Drawing Vertical Lines
    verticals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
            if(open) {
                return;
            }

            const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX,
                rowIndex * unitLengthY + unitLengthY / 2,
                5,
                unitLengthY,
                {
                    label: 'wall',
                    isStatic: true,
                    render: {
                        fillStyle: 'orange'
                    }
                }
            );
            World.add(world, wall);
        });
    });

    //  Adding Goal
    const goal = Bodies.rectangle(
        width - unitLengthX / 2,
        height - unitLengthY / 2,
        unitLengthX * 0.9,
        unitLengthY * 0.9,
        {
            label: 'goal',  //  To set a custom label to our Body object.
            isStatic: true,
            render: {
                fillStyle: 'green'
            }
        }
    );
    World.add(world, goal);

    //  Adding Ball
    const ballRadius = Math.min(unitLengthX, unitLengthY) * 0.40;
    const ball = Bodies.circle(
        unitLengthX / 2,
        unitLengthY / 2,
        ballRadius ,
        {
            label: 'ball',   //  To set a custom label to our Body object.
            render: {
                fillStyle: 'blue'
            }
        }
        // {    //  Don't add 'isStatic' here to 'true', as it will restrict the movement of ball.
        //     isStatic: true
        // }
    );
    World.add(world, ball);

    //  Adding key presses Events
    document.addEventListener('keydown', event => {
        const {x, y} = ball.velocity;
        if(event.keyCode === 87 || event.keyCode === 38) {  //  "UP"
            Body.setVelocity(ball, {x, y: y-5});
        }
        if(event.keyCode === 68 || event.keyCode === 39) {  //  "RIGHT"
            Body.setVelocity(ball, {x: x+5, y});
        }
        if(event.keyCode === 83 || event.keyCode === 40) {  //  "BOTTOM"
            Body.setVelocity(ball, {x, y: y+5});
        }
        if(event.keyCode === 65 || event.keyCode === 37) {  //  "LEFT"
            Body.setVelocity(ball, {x: x-5, y});
        }
    });

    //  Win Condition
    Events.on(engine, 'collisionStart', event => {
        event.pairs.forEach((collision) => {
            const labels = ['ball', 'goal'];
            if(labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)){
                document.querySelector('.winner').classList.remove('hidden');
                world.gravity.y = 1;
                world.bodies.forEach( body => {
                    if(body.label === 'wall'){
                        Body.setStatic(body, false);
                    }
                });
                Engine.clear(engine);
            }
        })
    });
}
