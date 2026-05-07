#include <graphics.h>
#include <conio.h>
#include <iostream>
using namespace std;

// Midpoint Circle Drawing Algorithm
void midpointCircle(int xc, int yc, int r)
{
    int x = 0;
    int y = r;

    // Initial decision parameter
    int d = 1 - r;

    // Plot initial points in all 8 octants
    while (x <= y)
    {
        putpixel(xc + x, yc + y, WHITE);
        putpixel(xc - x, yc + y, WHITE);
        putpixel(xc + x, yc - y, WHITE);
        putpixel(xc - x, yc - y, WHITE);
        putpixel(xc + y, yc + x, WHITE);
        putpixel(xc - y, yc + x, WHITE);
        putpixel(xc + y, yc - x, WHITE);
        putpixel(xc - y, yc - x, WHITE);

        x++;

        // Update decision parameter
        if (d < 0)
        {
            d += 2 * x + 1;
        }
        else
        {
            y--;
            d += 2 * (x - y) + 1;
        }
    }
}

int main()
{
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");

    int xc, yc, r;

    cout << "Enter center (xc yc): ";
    cin >> xc >> yc;
    cout << "Enter radius: ";
    cin >> r;

    // Draw circle using midpoint algorithm
    midpointCircle(xc, yc, r);

    outtextxy(xc - 5, yc - 5, (char*)"C");
    outtextxy(10, 10, (char*)"Midpoint Circle Drawing Algorithm");

    getch();
    closegraph();
    return 0;
}
