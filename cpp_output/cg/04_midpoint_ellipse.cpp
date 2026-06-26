#include <graphics.h>
#include <conio.h>
#include <iostream>
using namespace std;

// Midpoint Ellipse Drawing Algorithm
void midpointEllipse(int xc, int yc, int rx, int ry)
{
    float x = 0;
    float y = ry;

    // Region 1: slope < 1
    float d1 = (ry * ry) - (rx * rx * ry) + (0.25 * rx * rx);
    float dx = 2 * ry * ry * x;
    float dy = 2 * rx * rx * y;

    while (dx < dy)
    {
        // Plot points in all 4 quadrants
        putpixel(xc + x, yc + y, WHITE);
        putpixel(xc - x, yc + y, WHITE);
        putpixel(xc + x, yc - y, WHITE);
        putpixel(xc - x, yc - y, WHITE);

        if (d1 < 0)
        {
            x++;
            dx += 2 * ry * ry;
            d1 += dx + ry * ry;
        }
        else
        {
            x++;
            y--;
            dx += 2 * ry * ry;
            dy -= 2 * rx * rx;
            d1 += dx - dy + ry * ry;
        }
    }

    // Region 2: slope >= 1
    float d2 = (ry * ry * (x + 0.5) * (x + 0.5)) +
               (rx * rx * (y - 1) * (y - 1)) -
               (rx * rx * ry * ry);

    while (y >= 0)
    {
        putpixel(xc + x, yc + y, WHITE);
        putpixel(xc - x, yc + y, WHITE);
        putpixel(xc + x, yc - y, WHITE);
        putpixel(xc - x, yc - y, WHITE);

        if (d2 > 0)
        {
            y--;
            dy -= 2 * rx * rx;
            d2 += rx * rx - dy;
        }
        else
        {
            x++;
            y--;
            dx += 2 * ry * ry;
            dy -= 2 * rx * rx;
            d2 += dx - dy + rx * rx;
        }
    }
}

int main()
{
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");

    int xc, yc, rx, ry;

    cout << "Enter center (xc yc): ";
    cin >> xc >> yc;
    cout << "Enter x-radius (rx): ";
    cin >> rx;
    cout << "Enter y-radius (ry): ";
    cin >> ry;

    // Draw ellipse using midpoint algorithm
    midpointEllipse(xc, yc, rx, ry);

    outtextxy(xc - 5, yc - 5, (char*)"C");
    outtextxy(10, 10, (char*)"Midpoint Ellipse Drawing Algorithm");

    getch();
    closegraph();
    return 0;
}
