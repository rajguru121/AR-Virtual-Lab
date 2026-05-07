#include <graphics.h>
#include <conio.h>
#include <iostream>
using namespace std;

// DDA Line Drawing Algorithm
void ddaLine(int x1, int y1, int x2, int y2)
{
    int dx = x2 - x1;
    int dy = y2 - y1;

    // Calculate number of steps required
    int steps = abs(dx) > abs(dy) ? abs(dx) : abs(dy);

    // Calculate increment for each step
    float xInc = dx / (float)steps;
    float yInc = dy / (float)steps;

    float x = x1;
    float y = y1;

    // Plot each point
    for (int i = 0; i <= steps; i++)
    {
        putpixel((int)(x + 0.5), (int)(y + 0.5), WHITE);
        x += xInc;
        y += yInc;
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

    // Draw line using DDA algorithm
    ddaLine(x1, y1, x2, y2);

    // Label the line
    outtextxy(x1 - 10, y1 - 15, (char*)"P1");
    outtextxy(x2 + 5, y2 + 5, (char*)"P2");
    outtextxy(10, 10, (char*)"DDA Line Drawing Algorithm");

    getch();
    closegraph();
    return 0;
}
