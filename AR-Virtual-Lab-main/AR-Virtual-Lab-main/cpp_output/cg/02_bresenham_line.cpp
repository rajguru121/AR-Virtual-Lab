#include <graphics.h>
#include <conio.h>
#include <iostream>
using namespace std;

// Bresenham Line Drawing Algorithm
void bresenhamLine(int x1, int y1, int x2, int y2)
{
    int dx = abs(x2 - x1);
    int dy = abs(y2 - y1);

    // Direction of step
    int sx = (x1 < x2) ? 1 : -1;
    int sy = (y1 < y2) ? 1 : -1;

    // Initial decision parameter
    int err = dx - dy;

    while (true)
    {
        putpixel(x1, y1, WHITE);

        // Check if endpoint reached
        if (x1 == x2 && y1 == y2)
            break;

        int e2 = 2 * err;

        // Adjust x coordinate
        if (e2 > -dy)
        {
            err -= dy;
            x1 += sx;
        }

        // Adjust y coordinate
        if (e2 < dx)
        {
            err += dx;
            y1 += sy;
        }
    }
}

int main()
{
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");

    int x1, y1, x2, y2;

    cout << "Enter starting point (x1 y1): ";
    cin >> x1 >> y1;
    cout << "Enter ending point (x2 y2): ";
    cin >> x2 >> y2;

    // Draw line using Bresenham algorithm
    bresenhamLine(x1, y1, x2, y2);

    outtextxy(x1 - 10, y1 - 15, (char*)"P1");
    outtextxy(x2 + 5, y2 + 5, (char*)"P2");
    outtextxy(10, 10, (char*)"Bresenham Line Drawing Algorithm");

    getch();
    closegraph();
    return 0;
}
