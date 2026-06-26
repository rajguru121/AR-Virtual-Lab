#include <graphics.h>
#include <conio.h>
#include <math.h>
#include <iostream>
using namespace std;

// Calculate bezier point using De Casteljau's algorithm
// P(t) = (1-t)^3*P0 + 3*(1-t)^2*t*P1 + 3*(1-t)*t^2*P2 + t^3*P3
void bezierPoint(int x[], int y[], float t, int &px, int &py)
{
    float u = 1 - t;
    float u2 = u * u;
    float u3 = u2 * u;
    float t2 = t * t;
    float t3 = t2 * t;

    px = (int)(u3 * x[0] + 3 * u2 * t * x[1] + 3 * u * t2 * x[2] + t3 * x[3]);
    py = (int)(u3 * y[0] + 3 * u2 * t * y[1] + 3 * u * t2 * y[2] + t3 * y[3]);
}

int main()
{
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");

    int x[4], y[4];

    cout << "Enter 4 control points (x y):" << endl;
    for (int i = 0; i < 4; i++)
    {
        cout << "P" << i << ": ";
        cin >> x[i] >> y[i];
    }

    outtextxy(10, 10, (char*)"Bezier Curve");

    // Draw control polygon in dashed gray
    setcolor(DARKGRAY);
    setlinestyle(DASHED_LINE, 0, 1);
    for (int i = 0; i < 3; i++)
        line(x[i], y[i], x[i + 1], y[i + 1]);
    setlinestyle(SOLID_LINE, 0, 1);

    // Mark control points
    setcolor(YELLOW);
    for (int i = 0; i < 4; i++)
    {
        circle(x[i], y[i], 4);
        char label[10];
        sprintf(label, "P%d", i);
        outtextxy(x[i] + 8, y[i] - 12, label);
    }

    // Draw Bezier curve by sampling t from 0 to 1
    setcolor(GREEN);
    int prevX, prevY;
    bezierPoint(x, y, 0, prevX, prevY);

    for (float t = 0.01; t <= 1.0; t += 0.01)
    {
        int px, py;
        bezierPoint(x, y, t, px, py);
        line(prevX, prevY, px, py);
        prevX = px;
        prevY = py;
    }

    outtextxy(10, getmaxy() - 30, (char*)"Green = Bezier Curve | Gray = Control Polygon");

    getch();
    closegraph();
    return 0;
}
