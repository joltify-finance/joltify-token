* test 1: cap exceeded mint

  * max supply is capped with 21000000*10^18, constructor mint 10000000*10^18

  * if mint 11000000*10^18+1 again, failed, if mint 11000000*10^18, success

* test 2: add minter and test mint by new minter

  * address before added to minter, mint failed

  * after add address to minter, mint success

* test 3: add pauser and test pause by new minter

  * address before added to pauser, pause failed

  * after add address to pauser, pause and unpause success, and pause works fine

* test 4: add/remove owner(multiple owner allowed)
  * success