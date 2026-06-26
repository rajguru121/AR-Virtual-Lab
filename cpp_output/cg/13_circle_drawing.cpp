#include <graphics.h>
#include <conio.h>
#include <iostream>
using namespace std;

int main()
{
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");

    int xc, yc, r;

    cout << "Enter center of circle (xc yc): ";
    cin >> xc >> yc;
    cout << "Enter radius: ";
    cin >> r;

    outtextxy(10, 10, (char*)"Circle Drawing (Built-in + Manual)");

    // Method 1: Using built-in circle function
    setcolor(YELLOW);
    circle(xc, yc, r);
    outtextxy(xc + r + 10, yc, (char*)"Built-in");

    // Method 2: Using trigonometric approach (manual)
    setcolor(CYAN);
    int r2 = r + 30; // slightly larger for comparison
    for (int angle = 0; angle < 360; angle++)
    {
        float rad = angle * 3.14159 / 180.0;
        int x = xc + (int)(r2 * cos(rad));
        int y = yc + (int)(r2 * sin(rad));
        putpixel(x, y, CYAN);
    }
    outtextxy(xc + r2 + 10, yc, (char*)"Trigonometric");

    // Mark center
    setcolor(RED);
    putpixel(xc, yc, RED);
    circle(xc, yc, 2);
    outtextxy(xc + 5, yc + 5, (char*)"Center");

    getch();
    closegraph();
    return 0;
}
