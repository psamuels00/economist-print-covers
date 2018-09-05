function step1() {
    console.log('  step 1');
    return 1;
}

function step2() {
    console.log('  step 2');
    return 2;
}

function step3() {
    console.log('  step 3');
    return 3;
}

//--------------------------------------------------------------------------------
//                                   main
//--------------------------------------------------------------------------------

function run() {
    console.log('running economist...');
    step1();
    step2();
    step3();
}

//--------------------------------------------------------------------------------
//                                  exports
//--------------------------------------------------------------------------------

exports.run = run;
// for testing
exports.step1 = step1;
exports.step2 = step2;
exports.step3 = step3;

