PL/0-Scheme
=========

A programming language based on [PL/0 by Niklaus Wirth](http://en.wikipedia.org/wiki/PL/0), but with Scheme-like syntax.

You can [run the compiler online](http://peterolson.github.io/Pl0Scheme/PL0_Scheme.html).
The compiled code can be run on this online [PL/0 interpreter](http://ranger.uta.edu/~weems/NOTES3302/LAB1FALL14/pl0.display.3.html).

Example
---

The following PL/0-Scheme program 

    (while (= 1 1)
      (wait 10)
      (cvclear)
      (if (> cvx -1)
        (cvline cvx 0 cvx 300)
        (cvline 0 cvy 500 cvy)
        (cvline 0 0 cvx cvy)
        (cvline 0 300 cvx cvy)
        (cvline 500 0 cvx cvy)
        (cvline 500 300 cvx cvy)
        (cvball cvx cvy 20)))
        
compiles into the following PL/0 program:

    while 1 = 1 do 
    begin
    call wait(10);
    call cvclear;
    if cvx > -1 then 
    begin
    call cvline(cvx, 0, cvx, 300);
    call cvline(0, cvy, 500, cvy);
    call cvline(0, 0, cvx, cvy);
    call cvline(0, 300, cvx, cvy);
    call cvline(500, 0, cvx, cvy);
    call cvline(500, 300, cvx, cvy);
    call cvball(cvx, cvy, 20)
    end
    end.
    
You can see more examples in the examples file.
